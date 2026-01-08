
// ======================================================
// BACKEND NEXUS MANAGER - SYNCED WITH CNPJ & NEW PRICES
// ======================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJSONOutput({ status: 'online' });
    }

    var payload;
    try {
        payload = JSON.parse(e.postData.contents);
    } catch (err) {
        return createJSONOutput({ error: "JSON Inválido" });
    }
    
    var action = payload.action;
    var result = null;

    if (action === 'login') {
      result = handleLogin(payload);
    } else if (action === 'registerUser') {
      result = handleRegisterUser(payload);
    } else if (action === 'fetchData') {
      result = handleFetchData();
    } else if (action === 'saveItem') {
      result = handleSaveItem(payload);
    } else if (action === 'updateItem') {
      result = handleUpdateItem(payload);
    } else if (action === 'deleteItem') {
      result = handleDeleteItem(payload);
    } else {
      result = { error: "Ação desconhecida: " + action };
    }

    return createJSONOutput(result);

  } catch (error) {
    return createJSONOutput({ 'error': error.toString(), 'stack': error.stack });
  } finally {
    lock.releaseLock();
  }
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- HANDLERS ---

function handleFetchData() {
  return {
    users: readSheetData('Users'),
    companies: readSheetData('Companies'),
    clients: readSheetData('Clients'),
    projects: readSheetData('Projects'),
    sites: readSheetData('Sites'),
    partners: readSheetData('Partners'),
    saasProducts: readSheetData('SaaSProducts'),
    leads: readSheetData('Leads'),
    transactions: readSheetData('Transactions')
  };
}

function handleSaveItem(data) {
  var sheet = getSheet(data.collection);
  syncHeaders(sheet, data.item); 
  appendRow(sheet, data.item);
  return { success: true, id: data.item.id };
}

function handleUpdateItem(data) {
  var sheet = getSheet(data.collection);
  syncHeaders(sheet, data.item);
  SpreadsheetApp.flush(); 
  updateRow(sheet, data.item);
  return { success: true };
}

function handleDeleteItem(data) {
  var sheet = getSheet(data.collection);
  deleteRow(sheet, data.id);
  return { success: true };
}

function handleLogin(data) {
  var users = readSheetData('Users');
  var found = users.find(function(u) {
    return String(u.email).toLowerCase() === String(data.email).toLowerCase() && String(u.password) === String(data.password);
  });

  if (found) {
    var userSafe = JSON.parse(JSON.stringify(found));
    delete userSafe.password;
    return { user: userSafe };
  } else {
    throw new Error("Email ou senha incorretos.");
  }
}

function handleRegisterUser(data) {
  var usersSheet = getSheet('Users');
  var companiesSheet = getSheet('Companies');
  
  var users = readSheetData('Users');
  var exists = users.some(function(u) { return String(u.email).toLowerCase() === String(data.email).toLowerCase(); });
  if (exists) throw new Error("Este email já está cadastrado.");

  // --- LÓGICA DE PREÇOS E PLANOS (SINCRONIZADO COM FRONTEND) ---
  var prices = { 
    'Starter': { monthly: 97, yearly: 970 }, 
    'PRO': { monthly: 200, yearly: 2000 }, 
    'VIP': { monthly: 1000, yearly: 10000 } 
  };
  
  var planName = data.plan || 'Starter';
  var billingCycle = data.billingCycle || 'monthly';
  
  if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      billingCycle = 'monthly';
  }
  
  var pagamentoLabel = (billingCycle === 'yearly') ? 'Anual' : 'Mensal';
  var planPricing = prices[planName] || prices['Starter'];
  var finalPrice = (billingCycle === 'yearly') ? planPricing.yearly : planPricing.monthly;

  var companyId = 'comp-' + new Date().getTime();
  
  var dueDate = new Date();
  if (billingCycle === 'yearly') {
      dueDate.setDate(dueDate.getDate() + 365);
  } else {
      dueDate.setDate(dueDate.getDate() + 30);
  }

  // --- CRIAÇÃO DA EMPRESA (COM CNPJ) ---
  var newCompany = {
    id: companyId,
    name: data.companyId, 
    cnpj_cpf: data.cnpj || '', // Atualizado para CNPJ
    contactName: data.name,
    contactEmail: data.email,
    contactPhone: data.phone,
    subscriptionValue: finalPrice,
    currency: 'BRL',
    subscriptionStatus: 'Ativa',
    plan: planName,            
    billingCycle: billingCycle,
    pagamento: pagamentoLabel,
    subscriptionDueDate: dueDate.toISOString(), 
    paymentHistory: '[]'
  };

  syncHeaders(companiesSheet, newCompany);
  appendRow(companiesSheet, newCompany);

  // --- CRIAÇÃO DO USUÁRIO (COM CNPJ) ---
  var newUser = {
    id: 'user-' + new Date().getTime(),
    companyId: companyId,
    name: data.name,
    email: data.email,
    password: data.password,
    role: 'Admin',
    phone: data.phone || '',
    cnpj: data.cnpj || '', // Atualizado de cpf para cnpj
    plan: planName,            
    pagamento: pagamentoLabel
  };

  syncHeaders(usersSheet, newUser);
  appendRow(usersSheet, newUser);
  
  var safeUser = JSON.parse(JSON.stringify(newUser));
  delete safeUser.password;
  return { user: safeUser };
}

// --- FUNÇÕES DE BANCO DE DADOS ---

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['id']);
      SpreadsheetApp.flush();
    }
  }
  return sheet;
}

function readSheetData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2 || lastCol < 1) return [];

  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0];
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    var hasData = false;

    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var value = row[j];
      
      if (value !== "") hasData = true;

      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch (e) {}
      }
      obj[key] = value;
    }
    if (hasData) results.push(obj);
  }
  return results;
}

function syncHeaders(sheet, item) {
  var lastCol = sheet.getLastColumn();
  var headers = [];
  
  if (lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  
  var newHeaders = [];
  var existingMap = {};
  
  for (var i = 0; i < headers.length; i++) {
    existingMap[String(headers[i])] = true;
  }

  if (!existingMap['id']) {
    newHeaders.push('id');
    existingMap['id'] = true;
  }

  for (var key in item) {
    if (!existingMap[key]) {
      newHeaders.push(key);
      existingMap[key] = true;
    }
  }

  if (newHeaders.length > 0) {
    var startCol = (lastCol === 0) ? 1 : lastCol + 1;
    sheet.getRange(1, startCol, 1, newHeaders.length).setValues([newHeaders]);
    SpreadsheetApp.flush(); 
  }
}

function appendRow(sheet, item) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
      syncHeaders(sheet, item);
      lastCol = sheet.getLastColumn();
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = [];
  
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    var val = item[key];
    
    if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    }
    if (val === undefined || val === null) val = '';
    
    row.push(val);
  }
  sheet.appendRow(row);
}

function updateRow(sheet, item) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('id');
  
  if (idIndex === -1) {
     syncHeaders(sheet, item);
     data = sheet.getDataRange().getValues();
     headers = data[0];
     idIndex = headers.indexOf('id');
     if (idIndex === -1) throw new Error("ID column not found");
  }

  var rowIndex = -1;
  var itemIdStr = String(item.id);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === itemIdStr) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Item not found: " + item.id);

  for (var key in item) {
    var colIndex = headers.indexOf(key);
    if (colIndex > -1) {
      var val = item[key];
      if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
      if (val === undefined || val === null) val = '';
      
      sheet.getRange(rowIndex, colIndex + 1).setValue(val);
    }
  }
}

function deleteRow(sheet, id) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  
  var headers = data[0];
  var idIndex = headers.indexOf('id');
  
  if (idIndex === -1) return;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}
