// =========== PRODUCT MODAL SYSTEM ===========
function initProductModal() {
    // Add Product Button
    document.getElementById('add-product-btn').addEventListener('click', function() {
        openProductModal();
    });
    
    // Close modal on background click
    document.getElementById('product-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProductModal();
        }
    });
}

function openProductModal() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'flex';
    
    // Reset form
    resetProductForm();
    
    // Start at step 1
    showStep(1);
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    resetProductForm();
}

function resetProductForm() {
    // Clear inputs
    document.getElementById('product-name').value = '';
    
    // Reset selections
    currentProductType = null;
    currentProductSubtype = null;
    
    // Clear option selections
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Reset buttons
    document.getElementById('next-step2-btn').disabled = true;
    document.getElementById('next-step3-btn').disabled = true;
    
    // Clear dynamic content
    document.getElementById('step4-dynamic').innerHTML = '';
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.modal-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show requested step
    const step = document.getElementById(`step${stepNumber}`);
    if (step) {
        step.classList.add('active');
        
        // Focus first input if any
        const firstInput = step.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function nextStep(stepNumber) {
    // Validate current step
    if (stepNumber === 2) {
        const name = document.getElementById('product-name').value.trim();
        if (!name) {
            alert(currentLanguage === 'sw' ? 'Ingiza jina la bidhaa' : 'Enter product name');
            return;
        }
    }
    
    if (stepNumber === 3 && !currentProductType) {
        alert(currentLanguage === 'sw' ? 'Chagua jinsi bidhaa inavyouzwa' : 'Select how product is sold');
        return;
    }
    
    if (stepNumber === 4 && !currentProductSubtype) {
        alert(currentLanguage === 'sw' ? 'Chagua kipimo' : 'Select measurement unit');
        return;
    }
    
    showStep(stepNumber);
}

function prevStep(stepNumber) {
    showStep(stepNumber);
}

function selectSaleType(type) {
    // Update selection
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.option-btn').classList.add('selected');
    
    currentProductType = type;
    document.getElementById('next-step2-btn').disabled = false;
    
    // Populate subtype options
    populateSubtypeOptions(type);
}

function populateSubtypeOptions(type) {
    const container = document.getElementById('subtype-options');
    const typeDef = PRODUCT_TYPES[type];
    const lang = TRANSLATIONS[currentLanguage];
    
    if (!typeDef || !container) return;
    
    container.innerHTML = '';
    
    typeDef.units.forEach(unit => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.subtype = unit.id;
        button.onclick = function() { selectSubtype(unit.id); };
        
        // Get translated unit name
        const unitKey = `unit-${unit.id}`;
        const unitName = lang[unitKey] || unit.name;
        
        button.innerHTML = `
            ${getUnitIcon(unit.id)}<br>
            <span id="${unitKey}">${unitName}</span>
        `;
        
        container.appendChild(button);
    });
    
    // Reset subtype selection
    currentProductSubtype = null;
    document.getElementById('next-step3-btn').disabled = true;
}

function selectSubtype(subtypeId) {
    // Update selection
    document.querySelectorAll('#subtype-options .option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.option-btn').classList.add('selected');
    
    currentProductSubtype = subtypeId;
    document.getElementById('next-step3-btn').disabled = false;
    
    // Load step 4 template
    loadProductDetailsTemplate();
}

function getUnitIcon(unitId) {
    const icons = {
        'kg': '⚖️', 'g': '⚖️', 'tonne': '⚖️',
        'liter': '📊', 'ml': '📊',
        'pc': '🔢', 'pair': '👞', 'set': '📦',
        'meter': '📏', 'yard': '📏',
        'carton': '📦', 'strip': '💊', 'bottle': '🍾', 'sack': '🛍️',
        'custom': '✨'
    };
    return icons[unitId] || '📦';
}

function loadProductDetailsTemplate() {
    const container = document.getElementById('step4-dynamic');
    const typeDef = PRODUCT_TYPES[currentProductType];
    const lang = TRANSLATIONS[currentLanguage];
    
    if (!typeDef || !container) return;
    
    container.innerHTML = typeDef.template;
    
    // Update placeholders based on language
    const inputs = container.querySelectorAll('input[placeholder]');
    inputs.forEach(input => {
        const placeholder = input.placeholder;
        const key = `placeholder-${placeholder.toLowerCase().replace(/[^a-z]/g, '-')}`;
        if (lang[key]) {
            input.placeholder = lang[key];
        }
    });
    
    // Add labels for better UX
    const unit = typeDef.units.find(u => u.id === currentProductSubtype);
    if (unit) {
        const unitName = lang[`unit-${unit.id}`] || unit.name;
        container.querySelectorAll('input[type="number"]').forEach((input, index) => {
            if (index === 0 && input.id === 'product-quantity') {
                input.placeholder = `${input.placeholder} in ${unitName}`;
            } else if (input.id === 'product-price' || input.id === 'product-cost') {
                input.placeholder = `${input.placeholder} (TZS per ${unitName})`;
            }
        });
    }
}

// =========== DATA STORAGE ===========
let products = [];
let sales = [];
let debts = [];
let cash = { morning: 0, expenses: 0, lastUpdated: null };

function loadAppData() {
    // Load products
    const savedProducts = localStorage.getItem('bizbook_products');
    products = savedProducts ? JSON.parse(savedProducts) : [];
    
    // Load sales
    const savedSales = localStorage.getItem('bizbook_sales');
    sales = savedSales ? JSON.parse(savedSales) : [];
    
    // Load debts
    const savedDebts = localStorage.getItem('bizbook_debts');
    debts = savedDebts ? JSON.parse(savedDebts) : [];
    
    // Load cash
    const savedCash = localStorage.getItem('bizbook_cash');
    cash = savedCash ? JSON.parse(savedCash) : { morning: 0, expenses: 0, lastUpdated: null };
    
    // Refresh UI
    refreshProducts();
    refreshSales();
    refreshDebts();
    refreshCash();
    refreshBuyList();
}

function saveAppData() {
    localStorage.setItem('bizbook_products', JSON.stringify(products));
    localStorage.setItem('bizbook_sales', JSON.stringify(sales));
    localStorage.setItem('bizbook_debts', JSON.stringify(debts));
    localStorage.setItem('bizbook_cash', JSON.stringify(cash));
}

// =========== PRODUCT SAVING ===========
function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    if (!name) {
        alert(currentLanguage === 'sw' ? 'Ingiza jina la bidhaa' : 'Enter product name');
        return;
    }
    
    if (!currentProductType || !currentProductSubtype) {
        alert(currentLanguage === 'sw' ? 'Kamili maelezo ya bidhaa' : 'Complete product details');
        return;
    }
    
    // Get product details based on type
    const productData = collectProductData();
    if (!productData) return;
    
    // Create product object
    const product = {
        id: Date.now(),
        name: name,
        type: currentProductType,
        unit: currentProductSubtype,
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add to products array
    products.push(product);
    saveAppData();
    
    // Close modal and refresh
    closeProductModal();
    refreshProducts();
    refreshBuyList();
    
    // Show success message
    const successMsg = currentLanguage === 'sw' 
        ? `✅ ${name} imeongezwa kikamilifu!`
        : `✅ ${name} added successfully!`;
    alert(successMsg);
}

function collectProductData() {
    const typeDef = PRODUCT_TYPES[currentProductType];
    const unit = typeDef.units.find(u => u.id === currentProductSubtype);
    
    if (!unit) return null;
    
    const data = {
        unitSymbol: unit.symbol,
        unitName: TRANSLATIONS[currentLanguage][`unit-${unit.id}`] || unit.name
    };
    
    // Common fields for most types
    if (currentProductType !== 'packaging') {
        const quantity = parseFloat(document.getElementById('product-quantity').value);
        const price = parseInt(document.getElementById('product-price').value);
        const cost = parseInt(document.getElementById('product-cost').value);
        const minStock = parseFloat(document.getElementById('product-minstock').value);
        
        if (isNaN(quantity) || isNaN(price) || isNaN(cost) || isNaN(minStock)) {
            alert(currentLanguage === 'sw' ? 'Ingiza namba zote' : 'Enter all numbers');
            return null;
        }
        
        data.quantity = quantity;
        data.price = price;
        data.cost = cost;
        data.minStock = minStock;
        
        // For custom units
        if (currentProductType === 'other' && currentProductSubtype === 'custom') {
            const customUnit = document.getElementById('custom-unit').value.trim();
            if (customUnit) {
                data.unitSymbol = customUnit;
                data.unitName = customUnit;
            }
        }
    } else {
        // Packaging type has different fields
        const packageSize = parseInt(document.getElementById('package-size').value);
        const packageCost = parseInt(document.getElementById('package-cost').value);
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const price = parseInt(document.getElementById('product-price').value);
        const minStock = parseInt(document.getElementById('product-minstock').value);
        
        if (isNaN(packageSize) || isNaN(packageCost) || isNaN(quantity) || isNaN(price) || isNaN(minStock)) {
            alert(currentLanguage === 'sw' ? 'Ingiza namba zote' : 'Enter all numbers');
            return null;
        }
        
        data.packageSize = packageSize;
        data.packageCost = packageCost;
        data.quantity = quantity;
        data.price = price;
        data.cost = packageCost / packageSize; // Cost per item
        data.minStock = minStock;
        data.wholePackages = Math.floor(quantity / packageSize);
        data.openItems = quantity % packageSize;
    }
    
    return data;
}

// =========== PRODUCT DISPLAY ===========
function refreshProducts() {
    const container = document.getElementById('stock-list');
    const lang = TRANSLATIONS[currentLanguage];
    
    if (!products.length) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📦</div>
                <div style="font-size: 1.1rem; margin-bottom: 10px;">
                    ${currentLanguage === 'sw' ? 'Hakuna bidhaa bado' : 'No products yet'}
                </div>
                <div style="font-size: 0.9rem; opacity: 0.7;">
                    ${currentLanguage === 'sw' ? 'Bonyeza "Ongeza Bidhaa" kuanza' : 'Click "Add Product" to start'}
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => {
        // Determine status badge
        let badge = '';
        const stockPercent = (product.quantity / product.minStock) * 100;
        
        if (product.quantity === 0) {
            badge = '<span class="badge badge-danger">!</span>';
        } else if (product.quantity <= product.minStock) {
            badge = '<span class="badge badge-warning">!</span>';
        } else if (stockPercent < 150) {
            badge = '<span class="badge badge-success">✓</span>';
        }
        
        // Format details based on product type
        let details = '';
        if (product.type === 'packaging') {
            const fullPackages = Math.floor(product.quantity / product.packageSize);
            const openItems = product.quantity % product.packageSize;
            details = `
                ${product.quantity} items<br>
                ${fullPackages} full ${product.unitName} + ${openItems} open<br>
                Sell: ${formatCurrency(product.price)}/item
            `;
        } else {
            details = `
                ${product.quantity}${product.unitSymbol}<br>
                Sell: ${formatCurrency(product.price)}/${product.unitSymbol}<br>
                Min: ${product.minStock}${product.unitSymbol}
            `;
        }
        
        return `
            <div class="item" onclick="editProduct(${product.id})">
                <div class="item-info">
                    <div class="item-name">${product.name} ${badge}</div>
                    <div class="item-detail">${details}</div>
                </div>
                <div class="item-amount">${product.quantity}</div>
            </div>
        `;
    }).join('');
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const action = prompt(
        currentLanguage === 'sw' 
            ? `${product.name}\n\nChagua:\n1. Fanya mauzo\n2. Badilisha bei\n3. Badilisha idadi\n4. Ondoa bidhaa`
            : `${product.name}\n\nChoose:\n1. Make sale\n2. Change price\n3. Change quantity\n4. Remove product`,
        "1"
    );
    
    switch(action) {
        case "1": makeSale(productId); break;
        case "2": changeProductPrice(productId); break;
        case "3": changeProductQuantity(productId); break;
        case "4": deleteProduct(productId); break;
    }
}

function makeSale(productId) {
    // Sale logic here (to be implemented)
    alert('Sale function to be implemented');
}

function changeProductPrice(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newPrice = parseInt(prompt(
        currentLanguage === 'sw'
            ? `Bei mpya ya ${product.name} (sasa: ${formatCurrency(product.price)}/${product.unitSymbol}):`
            : `New price for ${product.name} (current: ${formatCurrency(product.price)}/${product.unitSymbol}):`,
        product.price
    ));
    
    if (newPrice && newPrice > 0) {
        product.price = newPrice;
        product.updatedAt = new Date().toISOString();
        saveAppData();
        refreshProducts();
        
        alert(
            currentLanguage === 'sw'
                ? `✅ Bei ya ${product.name} imebadilishwa: ${formatCurrency(newPrice)}/${product.unitSymbol}`
                : `✅ Price of ${product.name} changed: ${formatCurrency(newPrice)}/${product.unitSymbol}`
        );
    }
}

function changeProductQuantity(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = parseFloat(prompt(
        currentLanguage === 'sw'
            ? `Idadi mpya ya ${product.name} (sasa: ${product.quantity}${product.unitSymbol}):`
            : `New quantity for ${product.name} (current: ${product.quantity}${product.unitSymbol}):`,
        product.quantity
    ));
    
    if (!isNaN(newQuantity) && newQuantity >= 0) {
        product.quantity = newQuantity;
        product.updatedAt = new Date().toISOString();
        saveAppData();
        refreshProducts();
        refreshBuyList();
        
        alert(
            currentLanguage === 'sw'
                ? `✅ Idadi ya ${product.name} imebadilishwa: ${newQuantity}${product.unitSymbol}`
                : `✅ Quantity of ${product.name} changed: ${newQuantity}${product.unitSymbol}`
        );
    }
}

function deleteProduct(productId) {
    if (!confirm(
        currentLanguage === 'sw'
            ? 'Una uhakika unataka kufuta bidhaa hii?'
            : 'Are you sure you want to delete this product?'
    )) return;
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        const productName = products[productIndex].name;
        products.splice(productIndex, 1);
        saveAppData();
        refreshProducts();
        refreshBuyList();
        
        alert(
            currentLanguage === 'sw'
                ? `✅ ${productName} imefutwa`
                : `✅ ${productName} deleted`
        );
    }
}
