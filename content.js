// Variables
let currentBox = null;
let timeoutId = null;
let selectedText = '';
let isMouseInsideWindow = true;
let mousePosition = { x: 0, y: 0 };
let isBoxDisplayed = false; 
let requestCounter = 0;

// Style for disabling text selection while resizing the box
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

// Add noSelectStyle to the document head
const styleElement = document.createElement("style");
styleElement.textContent = noSelectStyle;
document.head.appendChild(styleElement);

// Helper function to check if an element is a text node
function isTextElement(element) {
  while (element) {
    if (element.nodeType === Node.TEXT_NODE) {
      return true;
    }
    element = element.parentNode;
  }
  return false;
}

// Store highlighted text and show the loading box
function storeHighlightedText() {
  // Remove existing boxes (if any)
  if (currentBox) {
    document.body.removeChild(currentBox);
    currentBox = null;
  }
  removeLoadingBox();

  selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    console.log("Stored text:", selectedText);

    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    let boxPosition = getBoxPosition(rect);

    // Display the loading box
    showLoadingBox(boxPosition);

    // Increment request counter
    requestCounter++;

    // Send the selected text to the background script
    chrome.runtime.sendMessage({
      action: "fetchExplanation",
      data: {
        text: selectedText,
        position: boxPosition,
        requestId: requestCounter,
      },
    });
  }
}



function getBoxPosition(rect) {
  let boxPosition = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height,
  };

  if (mousePosition.x < 0 || mousePosition.x > window.innerWidth || mousePosition.y < 0 || mousePosition.y > window.innerHeight) {
    boxPosition = {
      x: window.innerWidth / 2 - 200, // 200 is half the box width
      y: window.innerHeight / 2,
    };
  }

  return boxPosition;
}

// Event listeners for mouseenter and mouseleave



// Event listeners for mousedown and mouseup
// Add this new event listener
document.addEventListener("mousedown", (event) => {
  if (isMouseInsideWindow && !isBoxDisplayed && !event.target.closest("#loadingBox") && !event.target.closest("#explanationBox")) {
    timeoutId = setTimeout(storeHighlightedText, 2000);
  }
});

// Add this new event listener
document.addEventListener("mouseup", () => {
  if (!isBoxDisplayed) {
    clearTimeout(timeoutId);
  }
});

document.addEventListener("mouseup", (event) => {
  mousePosition.x = event.clientX;
  mousePosition.y = event.clientY;
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showExplanation") {
    const { explanation, position, requestId } = request.data;

    // Check if the received requestId matches the current requestCounter value
    if (requestId === requestCounter) {
      showExplanationBox(explanation, position);
      isBoxDisplayed = true; // Set the flag to true when the box is displayed
    }
  }
});


// Functions for showing and removing the loading box
function showLoadingBox(position) {
  const loadingBox = document.createElement("div");
  Object.assign(loadingBox.style, {
    position: "fixed",
    width: "150px",
    left: `${position.x}px`,
    top: `${position.y}px`,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "white",
    border: "3px solid gray",
    padding: "10px",
    zIndex: 10000,
  });

  loadingBox.id = "loadingBox";
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

// Function for showing the explanation box
function showExplanationBox(text, position) {
  // 1. Remove the existing box and loading box
  if (currentBox) {
    document.body.removeChild(currentBox);
  }
  removeLoadingBox();

  // 2. Create the main box
  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "fixed",
    width: "400px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "white",
    border: "3px solid gray",
    padding: "10px",
    zIndex: 10000,
  });

  // 3. Create and add the resize handle
  const resizeHandle = document.createElement("div");
  Object.assign(resizeHandle.style, {
    position: "absolute",
    width: "10px",
    height: "10px",
    bottom: "0",
    right: "0",
    cursor: "se-resize",
    backgroundColor: "gray",
  });
  box.appendChild(resizeHandle);

  // 4. Create and add the copy button
  const copyButton = document.createElement("button");
  Object.assign(copyButton.style, {
    position: "absolute",
    top: "5px",
    right: "5px",
    width: "25px",
    height: "25px",
    borderRadius: "4px",
    backgroundColor: "gray",
    color: "black",
    border: "2px solid gray",
    display: "flex", // Add this line
    justifyContent: "center", // Add this line
    alignItems: "center", // Add this line
  });
  copyButton.innerHTML = "&#128203;";
  box.appendChild(copyButton);

  // 5. Add event listener for copying the text
  copyButton.addEventListener("click", () => {
    const textToCopy = contentDiv.textContent;
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);
  });

  // 6. Make the box draggable
  box.onmousedown = dragMouseDown;
  let dragOffset = { x: 0, y: 0 };

  function dragMouseDown(e) {
    if (isTextElement(e.target)) {
      return;
    }
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
   // 7. Add event listeners for resizing the box
   let resizing = false;

   resizeHandle.addEventListener("mousedown", (e) => {
     e.stopPropagation();
     resizing = true;
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
     contentDiv.classList.remove("noselect");
   });
 // 8. Create the content div and add the text
 const contentDiv = document.createElement("div");
 contentDiv.textContent = text;
 Object.assign(contentDiv.style, {
   overflow: "auto",
   width: "100%",
   height: "100%",
 });
 box.appendChild(contentDiv);

 // 9. Add the box to the document and store it as the current box
 document.body.appendChild(box);

  const boxRect = box.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const padding = 17; // Add a padding constant to ensure the box doesn't touch the borders

  let top = position.y;
  let left = position.x;

  if (top + boxRect.height + padding > windowHeight) {
    top = windowHeight - boxRect.height - padding;
  }
  if (left + boxRect.width + padding > windowWidth) {
    left = windowWidth - boxRect.width - padding;
  }

  box.style.top = `${top}px`;
  box.style.left = `${left}px`;

 // 10. Close the box when clicking outside of it
 document.addEventListener("mousedown", closeBoxOnClickOutside, true);

 function closeBoxOnClickOutside(e) {
   if (!box.contains(e.target)) {
     if (document.body.contains(box)) {
       document.body.removeChild(box);
     }
     currentBox = null;
     document.removeEventListener("mousedown", closeBoxOnClickOutside, true);
     isBoxDisplayed = false; // Reset the flag after closing the box
   }
 }

 // Set isBoxDisplayed to true to prevent storeHighlightedText from being called
 // again until the current explanation box is closed
 isBoxDisplayed = true;
}

//This is just here to show ehen to undo to if this breaks everything