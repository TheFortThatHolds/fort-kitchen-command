// Fort Kitchen Command - Decision-Free Meal Management System
// JavaScript functionality for pantry tracking, recipe management, and shopping lists

// Pantry inventory - stored in localStorage
let pantryInventory = [];

// Recipes stored in localStorage for persistence
let approvedRecipes = [];

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Pantry Management Functions

function updateInventoryDisplay() {
    const inventoryContainer = document.getElementById('current-inventory');
    inventoryContainer.innerHTML = '';
    
    if (pantryInventory.length === 0) {
        inventoryContainer.innerHTML = '<p style="opacity: 0.7; text-align: center; grid-column: 1/-1;">No items in pantry yet. Upload photos or add items manually!</p>';
    } else {
        pantryInventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.textContent = item;
            itemDiv.onclick = () => removeInventoryItem(item);
            itemDiv.title = 'Click to remove';
            inventoryContainer.appendChild(itemDiv);
        });
    }
    savePantryToStorage();
}

function removeInventoryItem(item) {
    if (confirm(`Remove "${item}" from pantry?`)) {
        pantryInventory = pantryInventory.filter(i => i !== item);
        updateInventoryDisplay();
        updateMealSuggestions();
    }
}

function manualAddInventory() {
    const items = prompt('Add items to pantry (one per line or comma-separated):');
    if (items && items.trim()) {
        // Clean and split the items
        const itemList = items.split(/[,\n]+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        
        // Add to pantry
        pantryInventory.push(...itemList);
        updateInventoryDisplay();
        updateMealSuggestions();
        
        const count = itemList.length;
        showSuccessMessage(`Added ${count} item${count > 1 ? 's' : ''} to pantry!`);
    }
}

// Recipe Management Functions
// Helper function to clean up messy ingredient lists
function cleanIngredients(ingredientsText) {
    // Remove common formatting issues
    let cleaned = ingredientsText
        .replace(/▢/g, '') // Remove checkbox symbols
        .replace(/US Customary.*?Metric/gi, '') // Remove measurement toggles
        .replace(/Ingredients/gi, '') // Remove "Ingredients" headers
        .trim();
    
    // Try to detect pattern - ingredients mashed together with measurements
    // Look for patterns like "1 cup something2 tbsp something else"
    cleaned = cleaned.replace(/(\d+\s*(?:cup|cups|tsp|tbsp|tablespoon|teaspoon|oz|ounce|lb|pound|can|cloves?|small|medium|large)[\s\w\.\-,()]+?)(?=\d|$)/gi, '$1|');
    
    // Split by our inserted separator, commas, or newlines
    let ingredients = cleaned.split(/[|,\n]+/);
    
    // Clean each ingredient
    ingredients = ingredients
        .map(ing => ing.trim())
        .filter(ing => {
            // Keep ingredients that are meaningful
            return ing.length > 3 && 
                   !(/^\d+$/.test(ing)) && // Not just numbers
                   !(/^(cup|cups|tsp|tbsp|oz|small|medium|large)$/i.test(ing)); // Not just measurements
        });
    
    // Remove exact duplicates
    let uniqueIngredients = [];
    let seen = new Set();
    for (let ing of ingredients) {
        let normalized = ing.toLowerCase().replace(/\s+/g, ' ');
        if (!seen.has(normalized) && ing.trim()) {
            seen.add(normalized);
            uniqueIngredients.push(ing);
        }
    }
    
    return uniqueIngredients;
}

function addNewRecipe() {
    const recipeName = prompt('Recipe name:');
    if (!recipeName) return;
    
    const category = prompt('Category (breakfast/lunch/dinner/snack/dessert):')?.toLowerCase() || 'dinner';
    
    const ingredientsRaw = prompt('Ingredients (paste or type, comma-separated):');
    if (!ingredientsRaw) return;
    
    // Clean up the ingredients
    const ingredients = cleanIngredients(ingredientsRaw);
    
    const prepTime = parseInt(prompt('Prep time (minutes):'));
    if (!prepTime) return;
    
    const sourceURL = prompt('Source website (optional - for attribution):') || null;
    
    const notes = prompt('Notes (optional):') || '';
    
    const instructions = [];
    let step = prompt('Enter cooking instruction (or leave empty to finish):');
    while (step && step.trim()) {
        instructions.push(step.trim());
        step = prompt('Enter next instruction (or leave empty to finish):');
    }
    
    const newRecipe = {
        id: recipeName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: recipeName,
        category: category,
        ingredients: ingredients, // Already cleaned
        prepTime: prepTime,
        approved: true,  // Auto-approve since no Chris approval needed
        notes: notes,
        instructions: instructions,
        sourceURL: sourceURL,
        sourceName: sourceURL ? new URL(sourceURL).hostname.replace('www.', '') : null
    };
    
    approvedRecipes.push(newRecipe);
    updateRecipeDisplay();
    updateMealSuggestions();
    saveRecipesToStorage();
    showSuccessMessage(`Added recipe "${recipeName}"!`);
    
    // Update meal suggestions
    setTimeout(() => {
        showSection('recipes');
    }, 100);
}

function toggleRecipeApproval(recipeId) {
    const recipe = approvedRecipes.find(r => r.id === recipeId);
    if (recipe) {
        recipe.approved = !recipe.approved;
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage(recipe.approved ? '✅ Recipe approved!' : '⏸️ Recipe set to pending');
    }
}

// Track current filter
let currentCategoryFilter = 'all';

function updateRecipeDisplay(filter = currentCategoryFilter) {
    const container = document.getElementById('recipe-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filter recipes by category
    let recipesToShow = approvedRecipes;
    if (filter && filter !== 'all') {
        recipesToShow = approvedRecipes.filter(r => r.category === filter);
    }
    
    if (recipesToShow.length === 0) {
        if (approvedRecipes.length === 0) {
            container.innerHTML = '<p style="opacity: 0.7; text-align: center;">No recipes yet. Click "+ Add New Recipe" or "Import from URL" to get started!</p>';
        } else {
            container.innerHTML = `<p style="opacity: 0.7; text-align: center;">No ${filter} recipes yet. Add some or view all recipes!</p>`;
        }
    } else {
        // Group recipes by category if showing all
        const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
        const categoryEmojis = {
            'breakfast': '🌅',
            'lunch': '☀️',
            'dinner': '🌙',
            'snack': '🍿',
            'dessert': '🍰'
        };
        
        if (filter === 'all') {
            categories.forEach(cat => {
                const catRecipes = recipesToShow.filter(r => (r.category || 'dinner') === cat);
                if (catRecipes.length > 0) {
                    const categoryHeader = document.createElement('h3');
                    categoryHeader.style.cssText = 'color: #4ecdc4; margin-top: 20px; margin-bottom: 10px;';
                    categoryHeader.textContent = `${categoryEmojis[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
                    container.appendChild(categoryHeader);
                    
                    catRecipes.forEach(recipe => addRecipeCard(recipe, container));
                }
            });
            
            // Show uncategorized recipes
            const uncategorized = recipesToShow.filter(r => !r.category || !categories.includes(r.category));
            if (uncategorized.length > 0) {
                const categoryHeader = document.createElement('h3');
                categoryHeader.style.cssText = 'color: #4ecdc4; margin-top: 20px; margin-bottom: 10px;';
                categoryHeader.textContent = '📝 Other';
                container.appendChild(categoryHeader);
                
                uncategorized.forEach(recipe => addRecipeCard(recipe, container));
            }
        } else {
            recipesToShow.forEach(recipe => addRecipeCard(recipe, container));
        }
    }
    
    saveRecipesToStorage();
}

function addRecipeCard(recipe, container) {
    const recipeCard = document.createElement('div');
    recipeCard.className = 'recipe-card';
    recipeCard.onclick = () => showRecipeDetails(recipe.id);
    
    const categoryEmojis = {
        'breakfast': '🌅',
        'lunch': '☀️',
        'dinner': '🌙',
        'snack': '🍿',
        'dessert': '🍰'
    };
    
    const categoryEmoji = categoryEmojis[recipe.category] || '📝';
    const statusClass = recipe.approved ? 'approved' : 'pending';
    const statusText = recipe.approved ? '✅ Approved' : '⏸️ Pending';
    
    recipeCard.innerHTML = `
        <h3>${categoryEmoji} ${recipe.name}</h3>
        <div class="recipe-status ${statusClass}">${statusText}</div>
        ${recipe.sourceURL ? `<p style="font-size: 0.9em; opacity: 0.8;">📌 From: <a href="${recipe.sourceURL}" target="_blank" style="color: #4ecdc4;" onclick="event.stopPropagation();">${recipe.sourceName || new URL(recipe.sourceURL).hostname}</a></p>` : ''}
        <p><strong>Prep Time:</strong> ${recipe.prepTime} minutes</p>
        <p style="font-size: 0.9em; opacity: 0.8;"><strong>Ingredients:</strong> ${recipe.ingredients.slice(0, 3).join(', ')}${recipe.ingredients.length > 3 ? '...' : ''}</p>
        ${recipe.notes ? `<p style="font-size: 0.9em; opacity: 0.8;"><strong>Notes:</strong> ${recipe.notes}</p>` : ''}
    `;
    
    container.appendChild(recipeCard);
}

function filterRecipesByCategory(category) {
    currentCategoryFilter = category;
    
    // Update button states
    document.querySelectorAll('#recipes .nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    updateRecipeDisplay(category);
}

// Meal Planning Functions
function selectMeal(mealId) {
    const recipe = approvedRecipes.find(r => r.id === mealId);
    if (!recipe) {
        showErrorMessage('Recipe not found!');
        return;
    }
    
    // Show selected meal
    document.getElementById('selected-meal').style.display = 'block';
    document.getElementById('meal-name').textContent = recipe.name;
    
    // Show cooking instructions
    const instructionsDiv = document.getElementById('cooking-instructions');
    if (recipe.instructions) {
        instructionsDiv.innerHTML = `
            <h5>Cooking Instructions:</h5>
            <ol>
                ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
            </ol>
        `;
    } else {
        instructionsDiv.innerHTML = '<p>Instructions coming soon.</p>';
    }
    
    // Highlight selected option
    document.querySelectorAll('.meal-option').forEach(option => {
        option.style.borderColor = 'transparent';
    });
    event.target.style.borderColor = '#4ecdc4';
    
    showSuccessMessage(`Selected: ${recipe.name} - Ready to cook!`);
}

function startCooking() {
    showSuccessMessage('🔥 Happy cooking! Timer started for prep time.');
    // Could integrate with a cooking timer here
}

function updateMealSuggestions() {
    const mealOptionsDiv = document.getElementById('meal-options');
    if (!mealOptionsDiv) return;
    
    // Filter recipes based on available ingredients (if pantry has items)
    let suggestedRecipes = [];
    
    if (pantryInventory.length > 0) {
        // Show recipes we can make with current pantry
        suggestedRecipes = approvedRecipes.filter(recipe => {
            if (!recipe.approved) return false;
            
            // Check if we have at least some of the ingredients
            const matchingIngredients = recipe.ingredients.filter(ingredient => 
                pantryInventory.some(item => {
                    const itemLower = item.toLowerCase();
                    const ingLower = ingredient.toLowerCase();
                    return itemLower.includes(ingLower) || ingLower.includes(itemLower);
                })
            );
            
            // Show if we have at least 50% of ingredients
            return matchingIngredients.length >= recipe.ingredients.length * 0.5;
        });
    } else {
        // No pantry items - show all approved recipes
        suggestedRecipes = approvedRecipes.filter(r => r.approved);
    }
    
    // Update the meal options display
    if (suggestedRecipes.length === 0) {
        if (approvedRecipes.length === 0) {
            mealOptionsDiv.innerHTML = '<p style="opacity: 0.7; text-align: center;">Add some recipes first to see meal suggestions!</p>';
        } else if (pantryInventory.length === 0) {
            mealOptionsDiv.innerHTML = '<p style="opacity: 0.7; text-align: center;">Add pantry items to see meal suggestions!</p>';
        } else {
            mealOptionsDiv.innerHTML = '<p style="opacity: 0.7; text-align: center;">No recipes match your current pantry. Time to shop!</p>';
        }
    } else {
        mealOptionsDiv.innerHTML = '';
        suggestedRecipes.forEach(recipe => {
            const option = document.createElement('div');
            option.className = 'meal-option';
            option.onclick = () => selectMeal(recipe.id);
            option.innerHTML = `
                <h4>${recipe.name}</h4>
                <p style="font-size: 0.9em; opacity: 0.8;">⏱️ ${recipe.prepTime} min</p>
            `;
            mealOptionsDiv.appendChild(option);
        });
    }
    
    console.log('Available recipes based on pantry:', suggestedRecipes.length);
}

// Shopping List Functions
function generateShoppingList() {
    if (approvedRecipes.length === 0) {
        showErrorMessage('Add some recipes first to generate a shopping list!');
        return;
    }
    
    showLoadingMessage('Generating shopping list from your recipes...');
    
    setTimeout(() => {
        // Collect all ingredients from all recipes
        let allIngredients = [];
        approvedRecipes.forEach(recipe => {
            allIngredients.push(...recipe.ingredients);
        });
        
        // Remove duplicates and filter out what you already have in pantry
        const uniqueIngredients = [...new Set(allIngredients)];
        const shoppingItems = uniqueIngredients.filter(ingredient => 
            !pantryInventory.some(pantryItem => 
                ingredient.toLowerCase().includes(pantryItem.toLowerCase()) ||
                pantryItem.toLowerCase().includes(ingredient.toLowerCase())
            )
        );
        
        // Update the shopping list display
        const container = document.getElementById('shopping-list-container');
        
        if (shoppingItems.length === 0) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.8;">✅ You have everything you need for your recipes!</p>';
        } else {
            let listHTML = '<h4>🛒 Shopping List</h4>';
            shoppingItems.forEach(item => {
                listHTML += `
                    <div class="grocery-item">
                        <span>${item}</span>
                        <span style="opacity: 0.7;">□</span>
                    </div>
                `;
            });
            container.innerHTML = listHTML;
        }
        
        hideLoadingMessage();
        showSuccessMessage(`📝 Generated shopping list with ${shoppingItems.length} items!`);
    }, 1000);
}

function exportShoppingList() {
    // Collect current shopping list items
    const container = document.getElementById('shopping-list-container');
    const groceryItems = container.querySelectorAll('.grocery-item');
    
    if (groceryItems.length === 0) {
        showErrorMessage('Generate a shopping list first!');
        return;
    }
    
    let shoppingList = `Fort Kitchen Command - Shopping List\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    
    groceryItems.forEach(item => {
        const itemText = item.querySelector('span').textContent;
        shoppingList += `□ ${itemText}\n`;
    });
    
    shoppingList += `\nTotal items: ${groceryItems.length}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shoppingList).then(() => {
        showSuccessMessage('📱 Shopping list copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shoppingList;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccessMessage('📱 Shopping list copied to clipboard!');
    });
}

// Utility Functions
function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-message';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #4ecdc4, #44a08d);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
        z-index: 1000;
        font-weight: bold;
    `;
    loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            ${message}
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

function hideLoadingMessage() {
    const loadingDiv = document.getElementById('loading-message');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showInfoMessage(message) {
    showMessage(message, 'info');
}

function showMessage(message, type) {
    const colors = {
        success: { bg: '#4ecdc4', shadow: 'rgba(78, 205, 196, 0.4)' },
        error: { bg: '#ff6b6b', shadow: 'rgba(255, 107, 107, 0.4)' },
        info: { bg: '#ffa726', shadow: 'rgba(255, 167, 38, 0.4)' }
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type].bg};
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        box-shadow: 0 5px 15px ${colors[type].shadow};
        z-index: 1000;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Add slide animations
const slideStyle = document.createElement('style');
slideStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(slideStyle);

// Add function to import recipe from URL
async function importRecipeFromURL() {
    const url = prompt('Enter the recipe URL:');
    if (!url) return;
    
    showLoadingMessage('Fetching recipe from website...');
    
    try {
        // Extract domain name for attribution
        let sourceName;
        try {
            const urlObj = new URL(url);
            sourceName = urlObj.hostname.replace('www.', '');
        } catch (e) {
            sourceName = 'External Recipe';
        }
        
        // Use Netlify function to extract recipe
        const response = await fetch('/.netlify/functions/extract-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        
        hideLoadingMessage();
        
        if (!response.ok) {
            throw new Error('Failed to extract recipe');
        }
        
        const recipeData = await response.json();
        
        const newRecipe = {
            id: recipeData.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: recipeData.title,
            category: 'dinner', // Default to dinner for imported recipes
            ingredients: recipeData.ingredients.length > 0 ? recipeData.ingredients : ['See original recipe for ingredients'],
            prepTime: recipeData.prepTime || 30,
            approved: true,
            notes: `Imported from ${sourceName}`,
            sourceURL: url,
            sourceName: sourceName,
            instructions: recipeData.instructions.length > 0 ? recipeData.instructions : ['Visit the original recipe for detailed instructions']
        };
        
        approvedRecipes.push(newRecipe);
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage(`Recipe "${recipeData.title}" imported from ${sourceName}!`);
    } catch (error) {
        hideLoadingMessage();
        
        // Fallback - just create a link recipe
        const recipeName = prompt('Recipe name (or cancel):', 'Imported Recipe');
        if (!recipeName) return;
        
        let sourceName;
        try {
            const urlObj = new URL(url);
            sourceName = urlObj.hostname.replace('www.', '');
        } catch (e) {
            sourceName = 'External Recipe';
        }
        
        const newRecipe = {
            id: recipeName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: recipeName,
            category: 'dinner', // Default to dinner
            ingredients: ['See original recipe for ingredients'],
            prepTime: 30,
            approved: true,
            notes: `Imported from ${sourceName}`,
            sourceURL: url,
            sourceName: sourceName,
            instructions: ['Visit the original recipe for detailed instructions']
        };
        
        approvedRecipes.push(newRecipe);
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage(`Recipe link added - you can edit it to add full details!`);
    }
}

// Add function to show recipe details
function showRecipeDetails(recipeId) {
    const recipe = approvedRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    let detailsHTML = `
        <h3>${recipe.name}</h3>
        ${recipe.sourceURL ? `<p>📌 <a href="${recipe.sourceURL}" target="_blank" style="color: #4ecdc4;">View original recipe at ${recipe.sourceName}</a></p>` : ''}
        <p><strong>Prep Time:</strong> ${recipe.prepTime} minutes</p>
        <p><strong>Ingredients:</strong></p>
        <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
    `;
    
    if (recipe.instructions && recipe.instructions.length > 0) {
        detailsHTML += `
            <p><strong>Instructions:</strong></p>
            <ol>${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol>
        `;
    }
    
    if (recipe.notes) {
        detailsHTML += `<p><strong>Notes:</strong> ${recipe.notes}</p>`;
    }
    
    detailsHTML += `
        <br>
        <button class="btn" onclick="editRecipe('${recipeId}')">Edit Recipe</button>
        <button class="btn btn-secondary" onclick="deleteRecipe('${recipeId}')">Delete Recipe</button>
    `;
    
    // Create modal or expand card
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #4ecdc4;
        border-radius: 20px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 2000;
        color: white;
    `;
    modal.innerHTML = detailsHTML;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    backdrop.onclick = () => {
        modal.remove();
        backdrop.remove();
    };
    
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
}

// Add function to edit recipe with proper textarea
function editRecipe(recipeId) {
    const recipe = approvedRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Close the current modal first
    document.querySelector('div[style*="z-index: 2000"]')?.remove();
    document.querySelector('div[style*="z-index: 1999"]')?.remove();
    
    // Create a proper edit modal with textareas
    const editModal = document.createElement('div');
    editModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #4ecdc4;
        border-radius: 20px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 3000;
        color: white;
    `;
    
    editModal.innerHTML = `
        <h3 style="color: #4ecdc4; margin-bottom: 20px;">Edit Recipe</h3>
        
        <label style="display: block; margin-bottom: 5px;">Recipe Name:</label>
        <input type="text" id="edit-name" value="${recipe.name}" style="width: 100%; padding: 8px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 1px solid #4ecdc4; color: white; border-radius: 5px;">
        
        <label style="display: block; margin-bottom: 5px;">Category:</label>
        <select id="edit-category" style="width: 100%; padding: 8px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 1px solid #4ecdc4; color: white; border-radius: 5px;">
            <option value="breakfast" ${recipe.category === 'breakfast' ? 'selected' : ''}>🌅 Breakfast</option>
            <option value="lunch" ${recipe.category === 'lunch' ? 'selected' : ''}>☀️ Lunch</option>
            <option value="dinner" ${recipe.category === 'dinner' || !recipe.category ? 'selected' : ''}>🌙 Dinner</option>
            <option value="snack" ${recipe.category === 'snack' ? 'selected' : ''}>🍿 Snack</option>
            <option value="dessert" ${recipe.category === 'dessert' ? 'selected' : ''}>🍰 Dessert</option>
        </select>
        
        <label style="display: block; margin-bottom: 5px;">Ingredients (one per line):</label>
        <textarea id="edit-ingredients" style="width: 100%; height: 150px; padding: 8px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 1px solid #4ecdc4; color: white; border-radius: 5px; font-family: inherit;">${recipe.ingredients.join('\n')}</textarea>
        
        <label style="display: block; margin-bottom: 5px;">Instructions (one per line):</label>
        <textarea id="edit-instructions" style="width: 100%; height: 150px; padding: 8px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 1px solid #4ecdc4; color: white; border-radius: 5px; font-family: inherit;">${recipe.instructions ? recipe.instructions.join('\n') : ''}</textarea>
        
        <label style="display: block; margin-bottom: 5px;">Prep Time (minutes):</label>
        <input type="number" id="edit-preptime" value="${recipe.prepTime}" style="width: 100%; padding: 8px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 1px solid #4ecdc4; color: white; border-radius: 5px;">
        
        <label style="display: block; margin-bottom: 5px;">Notes:</label>
        <textarea id="edit-notes" style="width: 100%; height: 60px; padding: 8px; margin-bottom: 20px; background: rgba(255,255,255,0.1); border: 1px solid #4ecdc4; color: white; border-radius: 5px; font-family: inherit;">${recipe.notes || ''}</textarea>
        
        <div style="display: flex; gap: 10px;">
            <button onclick="saveRecipeEdits('${recipeId}')" class="btn">Save Changes</button>
            <button onclick="this.closest('div[style*=\\"z-index: 3000\\"]').remove(); document.getElementById('edit-backdrop').remove();" class="btn btn-secondary">Cancel</button>
        </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 2999;
    `;
    backdrop.onclick = () => {
        editModal.remove();
        backdrop.remove();
    };
    
    document.body.appendChild(backdrop);
    document.body.appendChild(editModal);
}

// Save recipe edits from the modal
function saveRecipeEdits(recipeId) {
    const recipe = approvedRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    recipe.name = document.getElementById('edit-name').value;
    recipe.category = document.getElementById('edit-category').value || 'dinner';
    
    // Clean and save ingredients
    const ingredientsText = document.getElementById('edit-ingredients').value;
    recipe.ingredients = cleanIngredients(ingredientsText);
    
    // Save instructions
    const instructionsText = document.getElementById('edit-instructions').value;
    recipe.instructions = instructionsText.split(/\n+/).filter(i => i.trim().length > 0);
    
    recipe.prepTime = parseInt(document.getElementById('edit-preptime').value) || 30;
    recipe.notes = document.getElementById('edit-notes').value;
    
    updateRecipeDisplay();
    updateMealSuggestions();
    saveRecipesToStorage();
    showSuccessMessage('Recipe updated!');
    
    // Close edit modal
    document.querySelector('div[style*="z-index: 3000"]')?.remove();
    document.getElementById('edit-backdrop')?.remove();
}

// Add function to delete recipe
function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        approvedRecipes = approvedRecipes.filter(r => r.id !== recipeId);
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage('Recipe deleted!');
        
        // Close modal
        document.querySelector('div[style*="z-index: 2000"]')?.remove();
        document.querySelector('div[style*="z-index: 1999"]')?.remove();
    }
}

// Add functions to save/load recipes from localStorage
function saveRecipesToStorage() {
    localStorage.setItem('fortKitchenRecipes', JSON.stringify(approvedRecipes));
}

function loadRecipesFromStorage() {
    const stored = localStorage.getItem('fortKitchenRecipes');
    if (stored) {
        try {
            approvedRecipes = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load recipes from storage');
            approvedRecipes = [];
        }
    } else {
        approvedRecipes = [];
    }
}

function savePantryToStorage() {
    localStorage.setItem('fortKitchenPantry', JSON.stringify(pantryInventory));
}

function loadPantryFromStorage() {
    const stored = localStorage.getItem('fortKitchenPantry');
    if (stored) {
        try {
            pantryInventory = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load pantry from storage');
            pantryInventory = [];
        }
    } else {
        pantryInventory = [];
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Load saved data
    loadPantryFromStorage();
    loadRecipesFromStorage();
    updateInventoryDisplay();
    updateRecipeDisplay();
    updateMealSuggestions();
    
    // Show welcome message only if no recipes exist
    if (approvedRecipes.length === 0) {
        showSuccessMessage('🏰 Fort Kitchen Command ready - Add your favorite recipes!');
    }
});

// Quick add function for pasting recipe text
function quickAddRecipe() {
    const recipeText = prompt('Paste the entire recipe text here (title, ingredients, instructions):');
    if (!recipeText) return;
    
    const sourceURL = prompt('Recipe source URL (optional):') || null;
    
    // Simple parsing - extract title from first line
    const lines = recipeText.split('\n').filter(line => line.trim());
    const recipeName = lines[0] || 'Quick Recipe';
    
    // Try to find ingredients (lines with common ingredient words)
    const ingredientKeywords = ['cup', 'tsp', 'tbsp', 'oz', 'lb', 'pound', 'ounce', 'tablespoon', 'teaspoon'];
    const ingredients = lines.filter(line => 
        ingredientKeywords.some(keyword => line.toLowerCase().includes(keyword)) ||
        line.match(/^\d+/) || // starts with number
        line.includes('•') || line.includes('-') // bullet points
    ).slice(0, 20); // limit to 20 ingredients
    
    // If no ingredients found, use some lines after the title
    const finalIngredients = ingredients.length > 0 ? ingredients : lines.slice(1, 10);
    
    let sourceName = null;
    if (sourceURL) {
        try {
            sourceName = new URL(sourceURL).hostname.replace('www.', '');
        } catch (e) {
            sourceName = 'External Recipe';
        }
    }
    
    const newRecipe = {
        id: recipeName.toLowerCase().replace(/\\s+/g, '-') + '-' + Date.now(),
        name: recipeName,
        category: 'dinner', // Default to dinner
        ingredients: finalIngredients.length > 0 ? finalIngredients : ['See recipe text for ingredients'],
        prepTime: 30,
        approved: true,
        notes: 'Quick-added recipe',
        sourceURL: sourceURL,
        sourceName: sourceName,
        instructions: ['See original recipe for detailed instructions']
    };
    
    approvedRecipes.push(newRecipe);
    updateRecipeDisplay();
    updateMealSuggestions();
    showSuccessMessage(`Quick recipe "${recipeName}" added!`);
}

// Reset function to clear everything
function resetApp() {
    if (confirm('This will delete all recipes and pantry items. Are you sure?')) {
        localStorage.clear();
        approvedRecipes = [];
        pantryInventory = [];
        updateInventoryDisplay();
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage('🔄 App reset! All data cleared.');
    }
}

// Add PWA service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Kitchen Command SW registered');
            })
            .catch(registrationError => {
                console.log('Kitchen Command SW registration failed');
            });
    });
}