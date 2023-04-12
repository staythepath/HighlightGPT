let currentBox = null;
let timeoutId = null;
let selectedText = '';

function storeHighlightedText() {
  selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    console.log("Stored text:", selectedText);

    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    const boxPosition = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height,
    };

    chrome.runtime.sendMessage({
      action: "fetchExplanation",
      data: {
        text: selectedText,
        position: boxPosition,
      },
    });
  }
}

document.addEventListener("mousedown", () => {
  timeoutId = setTimeout(storeHighlightedText, 2000);
});

document.addEventListener("mouseup", () => {
  clearTimeout(timeoutId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showExplanation") {
    const { explanation, position } = request.data;
    showExplanationBox(explanation, position);
  }
});

function showExplanationBox(text, position) {
  if (currentBox) {
    document.body.removeChild(currentBox); // Remove the existing box if there is one
  }

  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.left = `${position.x}px`;
  box.style.top = `${position.y}px`;
  box.style.backgroundColor = "rgba(0, 0, 0, 0.8)"; // Changed background to slightly transparent black
  box.style.color = "white";
  box.style.border = "1px solid black";
  box.style.padding = "10px";
  box.style.zIndex = 10000;
  
  // Make the box draggable
  box.onmousedown = dragMouseDown;
  let dragOffset = { x: 0, y: 0 };

  function dragMouseDown(e) {
    e.preventDefault();
    dragOffset.x = e.clientX - box.offsetLeft;
    dragOffset.y = e.clientY - box.offsetTop;
    document.onmousemove = dragMouseMove;
    document.onmouseup = closeDragElement;
  }

  function dragMouseMove(e) {
    e.preventDefault();
    box.style.left = e.clientX - dragOffset.x + "px";
    box.style.top = e.clientY - dragOffset.y + "px";
  }

  function closeDragElement() {
    document.onmousemove = null;
    document.onmouseup = null;
  }

  // Create a separate div for the text content
  const contentDiv = document.createElement("div");
  contentDiv.textContent = text;
  box.appendChild(contentDiv);

  document.body.appendChild(box);
  currentBox = box; // Store the current box

  // Close the box when clicking outside of it
  document.addEventListener("mousedown", closeBoxOnClickOutside, true);

  function closeBoxOnClickOutside(e) {
    if (!box.contains(e.target)) {
      document.body.removeChild(box);
      currentBox = null; // Clear the current box
      document.removeEventListener("mousedown", closeBoxOnClickOutside, true);
    }
  }
}


