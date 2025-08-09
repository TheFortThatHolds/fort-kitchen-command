const fetch = require('node-fetch');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url } = JSON.parse(event.body);
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let recipe = {
      title: '',
      ingredients: [],
      instructions: [],
      prepTime: null
    };

    // Try to find JSON-LD structured data first (most recipe sites use this)
    $('script[type="application/ld+json"]').each((i, element) => {
      try {
        const jsonData = JSON.parse($(element).html());
        const recipeData = Array.isArray(jsonData) 
          ? jsonData.find(item => item['@type'] === 'Recipe')
          : (jsonData['@type'] === 'Recipe' ? jsonData : null);

        if (recipeData) {
          recipe.title = recipeData.name || '';
          
          if (recipeData.recipeIngredient) {
            recipe.ingredients = recipeData.recipeIngredient.map(ing => 
              typeof ing === 'string' ? ing.trim() : ing.toString().trim()
            );
          }
          
          if (recipeData.recipeInstructions) {
            recipe.instructions = recipeData.recipeInstructions.map(inst => {
              if (typeof inst === 'string') return inst.trim();
              if (inst.text) return inst.text.trim();
              if (inst.name) return inst.name.trim();
              return inst.toString().trim();
            }).filter(inst => inst.length > 0);
          }

          if (recipeData.totalTime) {
            // Extract minutes from ISO 8601 duration or plain text
            const timeMatch = recipeData.totalTime.match(/(\d+)/);
            recipe.prepTime = timeMatch ? parseInt(timeMatch[1]) : null;
          }
        }
      } catch (e) {
        // Continue to next script tag
      }
    });

    // Fallback to HTML parsing if JSON-LD didn't work
    if (!recipe.title) {
      recipe.title = $('h1').first().text().trim() || 
                   $('[class*="recipe-title"], [class*="entry-title"]').first().text().trim() || 
                   $('title').text().replace(/\s*-\s*.*$/, '').trim() ||
                   'Imported Recipe';
    }

    if (recipe.ingredients.length === 0) {
      $('[class*="ingredient"], [itemprop="recipeIngredient"], .recipe-ingredient, .ingredient').each((i, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 0) {
          recipe.ingredients.push(text);
        }
      });
    }

    if (recipe.instructions.length === 0) {
      $('[class*="instruction"], [itemprop="recipeInstructions"], .recipe-instruction, .instruction, .directions li, .method li').each((i, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 0) {
          recipe.instructions.push(text);
        }
      });
    }

    // Clean up results
    recipe.ingredients = recipe.ingredients.slice(0, 30); // Limit to 30 ingredients
    recipe.instructions = recipe.instructions.slice(0, 20); // Limit to 20 instructions

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(recipe)
    };

  } catch (error) {
    console.error('Recipe extraction error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to extract recipe',
        message: error.message 
      })
    };
  }
};