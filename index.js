// fetch data from PokeAPI
const apiUrl = 'https://pokeapi.co/api/v2/pokemon?limit=151';
const fetchData = async () => {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error:', error);
  }
};

const pokemonList = document.querySelector('.pokemon-list');
const favoritesList = document.querySelector('.favorites-list');
const searchInput = document.querySelector('.search-input');
const filterPageItems = document.querySelectorAll('.filter-page li button');
const aToZ = document.querySelector('.a-to-z');
const zToA = document.querySelector('.z-to-a');
const limit = localStorage.setItem('filterLimit', 151);
const favTab = document.querySelector(".favs-tab");
const favWrapper = document.querySelector('.fav-wrapper');
const favNav = document.querySelector('.favorites-nav');
const open = "open";

const checkFavorites = () => {
  const favoritesHeader = document.querySelector('.sub-header');
  
  if (favoritesList.childElementCount === 0) {
    favoritesHeader.innerText = 'No Favorites Added';
  } else {
    favoritesHeader.innerText = 'My Favorite Pokemon';
  }
};

// create HTML for each Pokemon item
const createPokemonCard = (pokemon) => {
  const pokemonCard = document.createElement('div');
  pokemonCard.classList.add('pokemon-card');
  
  const pokemonImage = document.createElement('img');
  pokemonImage.src = pokemon.image;
  pokemonCard.appendChild(pokemonImage);
  
  const pokemonName = document.createElement('h3');
  pokemonName.innerText = pokemon.name;
  pokemonCard.appendChild(pokemonName);
  
  const pokemonNumber = document.createElement('p');
  pokemonNumber.innerText = `#${pokemon.number}`;
  pokemonCard.appendChild(pokemonNumber);
  
  const pokemonType = document.createElement('p');
  pokemonType.innerText = `Type: ${pokemon.type}`;
  pokemonType.classList.add('card-type');
  pokemonCard.appendChild(pokemonType);
  
  const pokemonAbilities = document.createElement('p');
  pokemonAbilities.innerText = `Abilities: ${pokemon.abilities}`;
  pokemonCard.appendChild(pokemonAbilities);
  
  const favToggle = document.createElement('button');
  favToggle.classList.add('fav-toggle');
  favToggle.innerText = localStorage.getItem('favorite-nums')?.split(',').includes(pokemon.number.toString()) ? 'Remove from Favorites' : 'Add to Favorites';

  // Add event listener to toggle the favorite button
  favToggle.addEventListener('click', () => {
    const favoriteNums = localStorage.getItem('favorite-nums')?.split(',') || [];
    
    if (favToggle.innerText === 'Add to Favorites') {
      favoritesList.appendChild(pokemonCard);
      pokemonCard.classList.add('fav-card');
      favToggle.innerText = 'Remove from Favorites';

      // Add the Pokemon number to the favorite-nums array
      favoriteNums.push(pokemon.number.toString());
      localStorage.setItem('favorite-nums', favoriteNums.join(','));
    } else {
      pokemonCard.remove()
      favToggle.innerText = 'Add to Favorites';
      pokemonList.insertBefore(pokemonCard, pokemonList.firstChild);

      // Remove the Pokemon number from the favorite-nums array
      const index = favoriteNums.indexOf(pokemon.number.toString());
      if (index > -1) {
        favoriteNums.splice(index, 1);
        localStorage.setItem('favorite-nums', favoriteNums.join(','));
      }
    }
    checkFavorites();
  });
  
  pokemonCard.appendChild(favToggle);
  checkFavorites();
  return pokemonCard;
};

const countTypes = () => {
  const typeCounts = {};
  const cards = document.querySelectorAll('.pokemon-card');
  
  cards.forEach((card) => {
    const typeList = card.querySelector('.card-type').innerText.split(': ')[1].split(', ');
    typeList.forEach((type) => {
      if (typeCounts[type]) {
        typeCounts[type]++;
      } else {
        typeCounts[type] = 1;
      }
    });
  });
  let mostPopularTypes = [];
  let highestCount = 0;
  for (const type in typeCounts) {
    if (typeCounts[type] > highestCount) {
      highestCount = typeCounts[type];
      mostPopularTypes = [type];
    } else if (typeCounts[type] === highestCount) {
      mostPopularTypes.push(type);
    }
  }

  const result = `Most Popular Type: ${mostPopularTypes.map(type => type.toUpperCase()).join(', ')} with ${highestCount} occurrences.`;
  const popStat = document.querySelector('.pop-stat');
  popStat.innerHTML = result;
};

// display a number of Pokemon on the home screen
const displayPokemon = async (limit, sortBy = '') => {
  const pokemons = await fetchData();

  // Fetch data for each Pokemon
  const pokemonData = await Promise.all(
    pokemons.map((pokemon) => fetch(pokemon.url).then((res) => res.json()))
  );

  // Create Pokemon objects from fetched data
  const pokemonObjects = pokemonData.map((data) => ({
    name: data.name,
    image: data.sprites.other['official-artwork'].front_default,
    number: data.id,
    type: data.types.map((type) => type.type.name).join(', '),
    abilities: data.abilities.map((ability) => ability.ability.name).join(', '),
  }));

  let pokeLimit = pokemonObjects.slice(0, limit);
  
  // Sort the Pokemon objects based on the sortBy parameter
  pokemonObjects.sort((a, b) => a.number - b.number);

  if (sortBy === 'asc') {
    pokemonObjects.sort((a, b) => a.name.localeCompare(b.name));
    pokeLimit.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'desc') {
    pokemonObjects.sort((a, b) => b.name.localeCompare(a.name));
    pokeLimit.sort((a, b) => b.name.localeCompare(a.name));
  } 
  
  // Add favorite Pokemon objects to favorites list
  pokemonObjects.forEach((object) => {
    if (localStorage.getItem('favorite-nums')?.split(',').includes(object.number.toString())) {
      if (![...favoritesList.children].some(card => card.dataset.number === object.number.toString())) {
        const pokemonCard = createPokemonCard(object);     
        favoritesList.appendChild(pokemonCard);
      }
      let favToggle = document.querySelectorAll('.favorites-list .fav-toggle');
      favToggle.innerText = 'Remove from Favorites';
    } 
  });

  let count = 0;

  pokemonObjects.forEach((object) => {
    if (count >= limit) {
      return; // stop the loop when the limit is reached
    } else if (localStorage.getItem('favorite-nums')?.split(',').includes(object.number.toString())) {
      return;
    } else {
      const pokemonCard = createPokemonCard(object);
      pokemonList.appendChild(pokemonCard);
      count++; // increment the counter after adding a card
    }
  });
  
  setTimeout(() => {
    countTypes();
  }, 500);
};

// search for a Pokemon by name
const searchPokemon = async () => {
  const pokemonList = document.querySelector('.pokemon-list');
  const searchQuery = searchInput.value.toLowerCase();

  const pokemons = await fetchData();
  const matchingPokemons = pokemons.filter((pokemon) => pokemon.name.includes(searchQuery));

  if (matchingPokemons.length > 0) {
    pokemonList.innerHTML = '';
    const matchingPokemonData = await Promise.all(
      matchingPokemons.map((pokemon) =>
        fetch(pokemon.url).then((res) => res.json())
      )
    );
    matchingPokemonData.forEach((pokemonData) => {
      const pokemonObject = {
        name: pokemonData.name,
        image: pokemonData.sprites.other['official-artwork'].front_default,
        number: pokemonData.id,
        type: pokemonData.types.map((type) => type.type.name).join(', '),
        abilities: pokemonData.abilities
          .map((ability) => ability.ability.name)
          .join(', '),
      };
      const pokemonCard = createPokemonCard(pokemonObject);
      pokemonList.prepend(pokemonCard);
    });
  }
};

searchInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchPokemon();
  }
});

filterPageItems.forEach(item => {
  item.addEventListener('click', () => {
    const filterLimit = item.textContent*1; 
    localStorage.setItem('filterLimit', filterLimit);
    const pokemonCards = document.querySelectorAll('.pokemon-card');
    pokemonCards.forEach((node) => {
      node.remove();
    })
    displayPokemon(filterLimit);
  });
});

// ALphabetical Sorting
aToZ.addEventListener('click', () => {
  const limit = localStorage.getItem('filterLimit');
  pokemonList.innerHTML = '';
  favoritesList.innerHTML = '';
  displayPokemon(limit, 'asc');
});

zToA.addEventListener('click', () => {
  const limit = localStorage.getItem('filterLimit');
  pokemonList.innerHTML = '';
  favoritesList.innerHTML = '';
  displayPokemon(limit, 'desc');
});

function toggleOpen(element) {
  element.classList.toggle(open);
}

favTab.addEventListener('click', function() {
  checkFavorites();
  const tab = this.parentElement.parentElement;
  toggleOpen(tab);
});

favNav.addEventListener('click', function() {
  checkFavorites();
  const tab = favTab.parentElement.parentElement;
  toggleOpen(tab);
});

displayPokemon(151);