beforeEach(() => {
  document.body.innerHTML = `
    <div id="board"></div>
    <button id="searchButton"></button>
    <input id="searchQuery" />
    <div id="searchResults"></div>
    <button id="addTextButton"></button>
    <button id="saveButton"></button>
    <button id="loginButton"></button>
    <button id="logoutButton"></button>
  `;

  global.firebase = {
    initializeApp: jest.fn(),
    auth: jest.fn(() => ({ signInWithPopup: jest.fn() })),
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn(() => Promise.resolve({ exists: false }))
        }))
      }))
    }))
  };
  global.firebase.auth.GoogleAuthProvider = function() {};

  global.html2canvas = jest.fn(() => Promise.resolve({ toDataURL: jest.fn() }));
  global.jspdf = { jsPDF: function() { return { addImage: jest.fn(), save: jest.fn() }; } };

  const dummyInteractable = {
    draggable: jest.fn(() => dummyInteractable),
    resizable: jest.fn(() => dummyInteractable)
  };
  global.interact = jest.fn(() => dummyInteractable);

  jest.resetModules();
});

test('createDraggableElement adds text node to board', () => {
  const { createDraggableElement } = require('../script');
  createDraggableElement('text', 'hello');
  const board = document.getElementById('board');
  const el = board.querySelector('.draggable');
  expect(el).not.toBeNull();
  expect(el.textContent).toBe('hello');
});
