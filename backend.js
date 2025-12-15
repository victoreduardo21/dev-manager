
// ======================================================
// BACKEND NEXUS MANAGER COMPLETO
// ======================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Nenhum dado recebido.");
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result = null;

    // Roteamento
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
    } else {
      throw new Error("Ação desconhecida: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
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
    leads: readSheetData('Leads')
  };
}

function handleSaveItem(data) {
  var sheet = getSheet(data.collection);
  // Garante que todas as chaves do objeto existam como colunas
  syncHeaders(sheet, data.item); 
  appendRow(sheet, data.item);
  return { success: true };
}

function handleUpdateItem(data) {
  var sheet = getSheet(data.collection);
  syncHeaders(sheet, data.item); // Garante headers caso novos campos sejam adicionados na edição
  updateRow(sheet, data.item);
  return { success: true };
}

function handleLogin(data) {
  var users = readSheetData('Users');
  // Busca case-insensitive no email
  var found = users.find(function(u) {
    return String(u.email).toLowerCase() === String(data.email).toLowerCase() && String(u.password) === String(data.password);
  });

  if (found) {
    delete found.password; // Remove senha do retorno
    return { user: found };
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

  // Configuração de Preços e Ciclos
  var prices = {
    'Starter': { monthly: 97, yearly: 970 },
    'PRO': { monthly: 200, yearly: 2000 },
    'VIP': { monthly: 500, yearly: 5000 }
  };
  
  var planName = data.plan || 'Starter';
  var billingCycle = data.billingCycle || 'monthly';
  var planData = prices[planName] || { monthly: 97, yearly: 970 };
  var planPrice = billingCycle === 'yearly' ? planData.yearly : planData.monthly;

  // Criar ID da Empresa
  var companyId = 'comp-' + new Date().getTime();

  // Calcular vencimento (30 dias ou 365 dias)
  var dueDate = new Date();
  if (billingCycle === 'yearly') {
      dueDate.setFullYear(dueDate.getFullYear() + 1);
  } else {
      dueDate.setDate(dueDate.getDate() + 30);
  }

  // Criar Registro da Empresa
  var newCompany = {
    id: companyId,
    name: data.companyId, // No cadastro simplificado, companyId vem com o nome
    cnpj_cpf: data.cpf || '',
    contactName: data.name,
    contactEmail: data.email,
    contactPhone: data.phone,
    subscriptionValue: planPrice,
    currency: 'BRL',
    subscriptionStatus: 'Ativa',
    plan: planName,
    billingCycle: billingCycle,
    subscriptionDueDate: dueDate.toISOString(), 
    paymentHistory: []
  };

  syncHeaders(companiesSheet, newCompany);
  appendRow(companiesSheet, newCompany);

  // Criar Usuário Admin vinculado à empresa
  var newUser = {
    id: 'user-' + new Date().getTime(),
    companyId: companyId, // Vincula ao ID gerado
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'Admin', // Primeiro usuário é Admin
    phone: data.phone || '',
    cpf: data.cpf || ''
  };

  syncHeaders(usersSheet, newUser);
  appendRow(usersSheet, newUser);
  
  var safeUser = JSON.parse(JSON.stringify(newUser));
  delete safeUser.password;
  return { user: safeUser };
}

// --- HELPERS DE BANCO DE DADOS (PLANILHA) ---

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Cria coluna ID padrão se for nova
    sheet.appendRow(['id']);
  }
  return sheet;
}

function readSheetData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; // Só tem cabeçalho ou está vazia

  var headers = data[0];
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var value = row[j];
      
      // Tenta fazer parse de JSON se parecer um objeto ou array
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Mantém como string se falhar
        }
      }
      // Converte datas para string ISO
      if (value instanceof Date) {
        value = value.toISOString();
      }
      
      obj[key] = value;
    }
    results.push(obj);
  }
  return results;
}

function appendRow(sheet, item) {
  var headers = sheet.getDataRange().getValues()[0];
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
  
  if (idIndex === -1) throw new Error("Coluna ID não encontrada na aba " + sheet.getName());

  var rowIndex = -1;
  // Procura a linha pelo ID
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(item.id)) {
      rowIndex = i + 1; // +1 porque linhas na planilha começam em 1
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Item com ID " + item.id + " não encontrado.");

  // Atualiza célula por célula para não perder dados de colunas que não estão no objeto item
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

// Verifica se existem novas chaves no objeto que não estão no cabeçalho e as adiciona
function syncHeaders(sheet, item) {
  var headers = sheet.getDataRange().getValues()[0];
  var newHeaders = [];
  var existingHeadersMap = {};
  
  // Mapeia headers existentes
  if (headers) {
    for (var i = 0; i < headers.length; i++) {
      existingHeadersMap[headers[i]] = true;
    }
  } else {
    headers = [];
  }

  // Verifica chaves do objeto
  for (var key in item) {
    if (!existingHeadersMap[key]) {
      newHeaders.push(key);
      headers.push(key); // Adiciona ao array local para próximas iterações
    }
  }

  // Se houver novos headers, adiciona na primeira linha
  if (newHeaders.length > 0) {
    // Se a planilha estiver totalmente vazia, apenas appendRow
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(newHeaders);
    } else {
      // Adiciona nas próximas colunas da linha 1
      var startCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, startCol, 1, newHeaders.length).setValues([newHeaders]);
    }
  }
}
