const BASE_URL_MEAL = 'https://www.themealdb.com/api/json/v1/1';
const BASE_URL_DRINK = 'https://www.thecocktaildb.com/api/json/v1/1';

export async function searchMeals(query) {
    try {
        const response = await fetch(`${BASE_URL_MEAL}/search.php?s=${query}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.meals; 
    } catch (error) {
        console.error('Error fetching meals:', error);
        throw error;
    }
}

export async function filterByCategory(category) {
    try {
        const response = await fetch(`${BASE_URL_MEAL}/filter.php?c=${category}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.meals;
    } catch (error) {
        console.error('Error filtering category:', error);
        throw error;
    }
}

export async function getCategories() {
    try {
        const response = await fetch(`${BASE_URL_MEAL}/list.php?c=list`);
        const data = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function getMealById(id) {
    try {
        const response = await fetch(`${BASE_URL_MEAL}/lookup.php?i=${id}`);
        const data = await response.json();
        return data.meals ? data.meals[0] : null;
    } catch (error) {
        console.error('Error fetching details:', error);
        return null;
    }
}

export async function getRandomPairingDrink() {
    try {
        const response = await fetch(`${BASE_URL_DRINK}/random.php`);
        const data = await response.json();
        return data.drinks ? data.drinks[0] : null;
    } catch (error) {
        console.error('Error fetching drink:', error);
        return null;
    }
}