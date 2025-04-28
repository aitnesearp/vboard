// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBlSEsBtFjNbzGeMOIQCKSJ8PCLr6oYvBE",
    authDomain: "vboard-7c203.firebaseapp.com",
    projectId: "vboard-7c203",
    storageBucket: "vboard-7c203.firebasestorage.app",
    messagingSenderId: "615042900708",
    appId: "1:615042900708:web:71e5dc14e78cfd12c102f1"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Elements
  const board = document.getElementById('board');
  const searchButton = document.getElementById('searchButton');
  const searchQuery = document.getElementById('searchQuery');
  const searchResults = document.getElementById('searchResults');
  const addTextButton = document.getElementById('addTextButton');
  const saveButton = document.getElementById('saveButton');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  
  // Google Custom Search settings
  const API_KEY = "YOUR_GOOGLE_API_KEY";
  const CX = "YOUR_CUSTOM_SEARCH_ENGINE_ID";
  
  // Event listeners
  loginButton.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(result => {
        const user = result.user;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'inline';
        loadUserBoard(user.uid);
      })
      .catch(console.error);
  });
  
  logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
      loginButton.style.display = 'inline';
      logoutButton.style.display = 'none';
      board.innerHTML = '';
    });
  });
  
  searchButton.addEventListener('click', async () => {
    const query = searchQuery.value;
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${query}&cx=${CX}&searchType=image&key=${API_KEY}`);
    const data = await res.json();
    
    searchResults.innerHTML = '';
    searchResults.style.display = 'block';
    
    data.items.forEach(item => {
      const img = document.createElement('img');
      img.src = item.link;
      img.style.width = '100px';
      img.addEventListener('click', () => {
        createDraggableElement('image', item.link);
        searchResults.style.display = 'none';
      });
      searchResults.appendChild(img);
    });
  });
  
  addTextButton.addEventListener('click', () => {
    const text = prompt('Enter your comment:');
    if (text) createDraggableElement('text', text);
  });
  
  saveButton.addEventListener('click', () => {
    html2canvas(board).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF();
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save('visionboard.pdf');
    });
  });
  
  // Core functions
  function createDraggableElement(type, content, data) {
    const el = document.createElement('div');
    el.className = 'draggable';
    el.style.left = data?.left || '100px';
    el.style.top = data?.top || '100px';
    el.style.width = data?.width || '150px';
    el.style.height = data?.height || '150px';
  
    if (type === 'image') {
      const img = document.createElement('img');
      img.src = content;
      img.style.width = '100%';
      el.appendChild(img);
    } else if (type === 'text') {
      el.textContent = content;
    }
  
    board.appendChild(el);
  
    interact(el)
      .draggable({ listeners: { move (event) { moveListener(event); } } })
      .resizable({ edges: { left: true, right: true, bottom: true, top: true }, listeners: { move (event) { resizeListener(event); } } });
  }
  
  function moveListener(event) {
    const target = event.target;
    const x = (parseFloat(target.style.left) || 0) + event.dx;
    const y = (parseFloat(target.style.top) || 0) + event.dy;
    target.style.left = x + 'px';
    target.style.top = y + 'px';
  }
  
  function resizeListener(event) {
    const target = event.target;
    const x = (parseFloat(target.style.left) || 0) + event.deltaRect.left;
    const y = (parseFloat(target.style.top) || 0) + event.deltaRect.top;
  
    target.style.width = event.rect.width + 'px';
    target.style.height = event.rect.height + 'px';
    target.style.left = x + 'px';
    target.style.top = y + 'px';
  }
  
  function saveUserBoard(uid) {
    const cards = [...document.querySelectorAll('.draggable')];
    const boardData = cards.map(card => ({
      type: card.querySelector('img') ? 'image' : 'text',
      content: card.querySelector('img') ? card.querySelector('img').src : card.textContent,
      left: card.style.left,
      top: card.style.top,
      width: card.style.width,
      height: card.style.height
    }));
  
    db.collection('boards').doc(uid).set({ items: boardData });
  }
  
  function loadUserBoard(uid) {
    db.collection('boards').doc(uid).get()
      .then(doc => {
        if (doc.exists) {
          const items = doc.data().items;
          board.innerHTML = '';
          items.forEach(item => {
            createDraggableElement(item.type, item.content, item);
          });
        }
      });
  }
  
  // Save user's board automatically when user moves away
  window.addEventListener('beforeunload', () => {
    const user = auth.currentUser;
    if (user) {
      saveUserBoard(user.uid);
    }
  });
  