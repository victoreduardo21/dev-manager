// ======================================================
// BACKEND NEXUS MANAGER - SYNCED PRICES
// ======================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    if (!e || !e.postData || !e.postData.contents) return createJSONOutput({ status: 'online' });
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result = null;

    if (action === 'login') result = handleLogin(payload);
    else if (action === 'registerUser') result = handleRegisterUser(payload);
    else if (action === 'fetchData') result = handleFetchData();
    else if (action === 'saveItem') result = handleSaveItem(payload);
    else if (action === 'updateItem') result = handleUpdateItem(payload);
    else if (action === 'deleteItem') result = handleDeleteItem(payload);
    else result = { error: "Ação desconhecida" };

    return createJSONOutput(result);
  } catch (error) {
    return createJSONOutput({ 'error': error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function handleRegisterUser(data) {
  var prices = { 
    'Starter': { monthly: 97, yearly: 970 }, 
    'PRO': { monthly: 200, yearly: 2000 }, 
    'VIP': { monthly: 1000, yearly: 10000 } 
  };
  
  var plan = data.plan || 'Starter';
  var cycle = data.billingCycle || 'monthly';
  var planPricing = prices[plan] || prices['Starter'];
  var finalPrice = (cycle === 'yearly') ? planPricing.yearly : planPricing.monthly;

  var companyId = 'comp-' + new Date().getTime();
  var dueDate = new Date();
  if (cycle === 'yearly') dueDate.setDate(dueDate.getDate() + 365);
  else dueDate.setDate(dueDate.getDate() + 30);

  var newCompany = {
    id: companyId,
    name: data.companyId,
    contactEmail: data.email,
    subscriptionValue: finalPrice,
    subscriptionStatus: 'Ativa',
    plan: plan,
    billingCycle: cycle,
    subscriptionDueDate: dueDate.toISOString(),
    paymentHistory: '[]'
  };

  appendRow(getSheet('Companies'), newCompany);

  var newUser = {
    id: 'user-' + new Date().getTime(),
    companyId: companyId,
    name: data.name,
    email: data.email,
    password: data.password,
    role: 'Admin',
    plan: plan
  };

  appendRow(getSheet('Users'), newUser);
  return { user: newUser };
}

// ... Rest of the functions (createJSONOutput, getSheet, readSheetData, syncHeaders, appendRow, updateRow, deleteRow)
// ... keeping current implementation for DB operations