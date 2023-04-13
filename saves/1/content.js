let currentBox = null;
let timeoutId = null;
let selectedText = '';

const noSelectStyle = `
  .noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
`;

const styleElement = document.createElement("style");

styleElement.textContent = noSelectStyle;

document.head.appendChild(styleElement);

function isTextElement(element) {
  while (element) {
    if (element.nodeType === Node.TEXT_NODE) {
      return true;
    }
    element = element.parentNode;
  }
  return false;
}

function storeHighlightedText() {
  selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    console.log("Stored text:", selectedText);

    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    const boxPosition = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height,
    };

    // Display the loading box
    showLoadingBox(boxPosition);

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

function showLoadingBox(position) {
  const loadingBox = document.createElement("div");
  loadingBox.id = "loadingBox";
  loadingBox.style.position = "fixed";
  loadingBox.style.width = "150px";
  loadingBox.style.left = `${position.x}px`;
  loadingBox.style.top = `${position.y}px`;
  loadingBox.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  loadingBox.style.color = "white";
  loadingBox.style.border = "3px solid gray";
  loadingBox.style.padding = "10px";
  loadingBox.style.zIndex = 10000;
  loadingBox.textContent = "Loading";

  document.body.appendChild(loadingBox);

  let ellipsesCount = 0;
  const maxEllipses = 30;
  const ellipsesInterval = setInterval(() => {
    ellipsesCount = (ellipsesCount + 1) % (maxEllipses + 1);
    loadingBox.textContent = "Loading" + ".".repeat(ellipsesCount);
  }, 500); // Update ellipses every 500ms

  // Store the interval ID as a data attribute so it can be cleared later
  loadingBox.dataset.intervalId = ellipsesInterval;
}

function removeLoadingBox() {
  const loadingBox = document.getElementById("loadingBox");
  if (loadingBox) {
    clearInterval(loadingBox.dataset.intervalId); // Clear the ellipses interval
    document.body.removeChild(loadingBox);
  }
}


function showExplanationBox(text, position) {
  if (currentBox) {
    document.body.removeChild(currentBox); // Remove the existing box if there is one
  }
  
  removeLoadingBox();

  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.width = "400px";
  box.style.left = `${position.x}px`;
  box.style.top = `${position.y}px`;
  box.style.backgroundColor = "rgba(0, 0, 0, 0.6)"; // Changed background to slightly transparent black
  box.style.color = "white";
  box.style.border = "3px solid gray";
  box.style.padding = "10px";
  box.style.zIndex = 10000;

  // Create a resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.style.position = "absolute";
  resizeHandle.style.width = "10px";
  resizeHandle.style.height = "10px";
  resizeHandle.style.bottom = "0";
  resizeHandle.style.right = "0";
  resizeHandle.style.cursor = "se-resize";
  resizeHandle.style.backgroundColor = "gray";
  box.appendChild(resizeHandle);

  // Make the box draggable
  box.onmousedown = dragMouseDown;
  let dragOffset = { x: 0, y: 0 };

  function dragMouseDown(e) {
    // Check if the user clicked on the text content
    if (isTextElement(e.target)) {
      // If the mouse is over a text element, allow text selection
      return;
    }
  
    // Otherwise, allow dragging of the box
    isDragging = true;
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

  // Add event listeners for resizing the box
  let resizing = false;

  resizeHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation(); // Prevent the box from being dragged when resizing
    resizing = true;
  
    // Add the 'noselect' class to the content div while resizing
    contentDiv.classList.add("noselect");
  });
  
  document.addEventListener("mousemove", (e) => {
    if (resizing) {
      const newWidth = e.clientX - box.offsetLeft + 5;
      const newHeight = e.clientY - box.offsetTop + 5;
  
      box.style.width = `${newWidth}px`;
      box.style.height = `${newHeight}px`;
    }
  });
  
  document.addEventListener("mouseup", () => {
    resizing = false;
  
    // Remove the 'noselect' class from the content div after resizing is finished
    contentDiv.classList.remove("noselect");
  });

  // Create a separate div for the text content
  const contentDiv = document.createElement("div");
  contentDiv.textContent = text;
  contentDiv.style.overflow = "auto"; // Enable scrollbars when the text overflows
  contentDiv.style.width = "100%";
  contentDiv.style.height = "100%";
  box.appendChild(contentDiv);

  document.body.appendChild(box);
  currentBox = box; // Store the current box

  // Close the box when clicking outside of it
  document.addEventListener("mousedown", closeBoxOnClickOutside, true);

  function closeBoxOnClickOutside(e) {
    if (!box.contains(e.target)) {
      if (document.body.contains(box)) {
        document.body.removeChild(box);
      }
      currentBox = null; // Clear the current box
      document.removeEventListener("mousedown", closeBoxOnClickOutside, true);
    }
  }
}



// this is put here to mark a big change!! If it is broken undo until this disappears