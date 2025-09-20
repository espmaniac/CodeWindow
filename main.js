window.addEventListener("DOMContentLoaded", () => {
  let isPanning = false;
  let startX, startY;
  let scale = 1;
  let panX = 0, panY = 0;
  let activeWindow = null;
  let activeTab = null;

  const windowsContainer = document.getElementById("windowsContainer");
  const tabsContainer = document.getElementById("tabs");

  const fileModes = {
    "javascript": ["js", "mjs", "cjs"],
    "text/x-csrc": ["c", "h"],
    "text/x-c++src": ["cpp", "hpp", "cc", "cxx"],
    "text/x-java": ["java"],
    "text/x-csharp": ["cs"],
    "text/x-python": ["py"],
    "text/html": ["html", "htm"],
    "htmlmixed": ["ejs", "erb", "jsp", "php"],
    "text/css": ["css"],
    "application/json": ["json"],
    "text/xml": ["xml"],
    "text/x-go": ["go"],
    "text/x-ruby": ["rb", "rake"],
    "text/plain": ["txt", "log", "md"]
  };

  function getModeByFilename(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    for (const [mode, exts] of Object.entries(fileModes)) {
      if (exts.includes(ext)) return mode;
    }
    return "text/plain";
  }

  function createTab(name, windowElement) {
    const tab = document.createElement("div");
    tab.classList.add("tab");
    tab.innerText = name;
    tab._windowElement = windowElement;
    windowElement._tab = tab;

    tab.addEventListener("click", () => {
      if (tab.classList.contains("minimized")) {
        restoreWindow(windowElement);
        return;
      }
      if (activeTab) activeTab.classList.remove("active");
      tab.classList.add("active");
      activeTab = tab;

      if (activeWindow !== windowElement) {
        if (activeWindow) activeWindow.classList.remove("active");
        windowElement.classList.add("active");
        activeWindow = windowElement;
      }
    });

    tabsContainer.appendChild(tab);

    if (!activeTab) {
      tab.classList.add("active");
      activeTab = tab;
    }
  }

  function restoreWindow(windowElement) {
    windowElement.style.display = "block";
    if (windowElement._tab) {
      windowElement._tab.classList.remove("minimized");
      windowElement._tab.classList.add("active");
      activeTab = windowElement._tab;
    }
    windowElement.classList.add("active");
    activeWindow = windowElement;

    const container = windowElement._container;
    const baseWidth = 600;
    const baseHeight = 360;
    const lastWidth = windowElement._lastWidth || baseWidth;
    const lastHeight = windowElement._lastHeight || baseHeight;

    container.style.width = lastWidth * scale + "px";
    container.style.height = lastHeight * scale + "px";

    if (windowElement._editor) {
      // Only for text/code windows
      const editor = windowElement._editor;
      const wrapper = editor.getWrapperElement();
      wrapper.style.width = "100%";
      wrapper.style.height = "100%";
      wrapper.style.fontSize = `${14 * scale}px`;
      editor.refresh();
    }

    const headerHeight = windowElement.querySelector(".window-header").offsetHeight;
    windowElement.style.width = container.offsetWidth + "px";
    windowElement.style.height = container.offsetHeight + headerHeight + "px";
  }

  function createWindow(name, content) {
    const windowElement = document.createElement("div");
    windowElement.classList.add("window");

    const windowHeader = document.createElement("div");
    windowHeader.classList.add("window-header");
    windowHeader.innerText = name;

    const closeButton = document.createElement("button");
    closeButton.classList.add("close-btn");
    closeButton.innerText = "X";
    closeButton.addEventListener("click", () => {
      windowElement._resizeObserver?.disconnect();
      windowElement.remove();
      if (windowElement._tab) {
        windowElement._tab.remove();
        if (activeTab === windowElement._tab) activeTab = null;
      }
      if (activeWindow === windowElement) activeWindow = null;
      const remainingWindows = document.querySelectorAll(".window");
      if (remainingWindows.length > 0) {
        const lastWindow = remainingWindows[remainingWindows.length - 1];
        lastWindow.classList.add("active");
        activeWindow = lastWindow;
        const lastTab = lastWindow._tab;
        if (lastTab) {
          lastTab.classList.add("active");
          activeTab = lastTab;
        }
      }
    });

    const minimizeButton = document.createElement("button");
    minimizeButton.classList.add("minimize-btn");
    minimizeButton.innerText = "_";
    minimizeButton.addEventListener("click", () => {
      // Save current size before minimizing (for both code and image windows)
      const editorContainer = windowElement._container;
      windowElement._lastWidth = editorContainer.offsetWidth / scale;
      windowElement._lastHeight = editorContainer.offsetHeight / scale;

      windowElement.style.display = "none";
      if (windowElement._tab) {
        windowElement._tab.classList.remove("active");
        windowElement._tab.classList.add("minimized");
      }
      if (activeWindow === windowElement) activeWindow = null;
      if (activeTab === windowElement._tab) activeTab = null;
    });

    const baseWidth = 600;
    const baseHeight = 360;

    windowElement.style.left = (-panX + (window.innerWidth - baseWidth) / 2) + "px";
    windowElement.style.top  = -panY + (window.innerHeight - baseHeight) / 2 + "px";

    const editorContainer = document.createElement("div");
    editorContainer.classList.add("editor-container");
    editorContainer.style.width = baseWidth * scale + "px";
    editorContainer.style.height = baseHeight * scale + "px";
    editorContainer.style.resize = "both";
    editorContainer.style.overflow = "hidden";

    windowElement.appendChild(windowHeader);
    windowElement.appendChild(closeButton);
    windowElement.appendChild(minimizeButton);
    windowElement.appendChild(editorContainer);
    windowsContainer.appendChild(windowElement);

    createTab(name, windowElement);

    if (activeWindow) activeWindow.classList.remove("active");
    windowElement.classList.add("active");
    activeWindow = windowElement;

    initWindowDrag(windowElement);
    initCodeMirror(windowElement, editorContainer, name);

    windowElement._editor.setValue(content);
    windowElement.dataset.scale = scale;
  }

  // Check if the file is an image
  function isImageFile(file) {
    if (file.type && file.type.startsWith("image/")) return true;
    const imgExts = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];
    const ext = file.name.split('.').pop().toLowerCase();
    return imgExts.includes(ext);
  }

  // Create a window for an image
  function createImageWindow(name, dataURL) {
    const windowElement = document.createElement("div");
    windowElement.classList.add("window");

    const windowHeader = document.createElement("div");
    windowHeader.classList.add("window-header");
    windowHeader.innerText = name;

    const closeButton = document.createElement("button");
    closeButton.classList.add("close-btn");
    closeButton.innerText = "X";
    closeButton.addEventListener("click", () => {
      windowElement._resizeObserver?.disconnect();
      windowElement.remove();
      if (windowElement._tab) {
        windowElement._tab.remove();
        if (activeTab === windowElement._tab) activeTab = null;
      }
      if (activeWindow === windowElement) activeWindow = null;
      const remainingWindows = document.querySelectorAll(".window");
      if (remainingWindows.length > 0) {
        const lastWindow = remainingWindows[remainingWindows.length - 1];
        lastWindow.classList.add("active");
        activeWindow = lastWindow;
        const lastTab = lastWindow._tab;
        if (lastTab) {
          lastTab.classList.add("active");
          activeTab = lastTab;
        }
      }
    });

    const minimizeButton = document.createElement("button");
    minimizeButton.classList.add("minimize-btn");
    minimizeButton.innerText = "_";
    minimizeButton.addEventListener("click", () => {
      // Save size for image windows as well
      const imgContainer = windowElement._container;
      windowElement._lastWidth = imgContainer.offsetWidth / scale;
      windowElement._lastHeight = imgContainer.offsetHeight / scale;

      windowElement.style.display = "none";
      if (windowElement._tab) {
        windowElement._tab.classList.remove("active");
        windowElement._tab.classList.add("minimized");
      }
      if (activeWindow === windowElement) activeWindow = null;
      if (activeTab === windowElement._tab) activeTab = null;
    });

    const baseWidth = 600;
    const baseHeight = 360;

    windowElement.style.left = (-panX + (window.innerWidth - baseWidth) / 2) + "px";
    windowElement.style.top  = -panY + (window.innerHeight - baseHeight) / 2 + "px";

    const imgContainer = document.createElement("div");
    imgContainer.classList.add("editor-container");
    imgContainer.style.width = baseWidth * scale + "px";
    imgContainer.style.height = baseHeight * scale + "px";
    imgContainer.style.resize = "both";
    imgContainer.style.overflow = "hidden";
    imgContainer.style.display = "flex";
    imgContainer.style.alignItems = "center";
    imgContainer.style.justifyContent = "center";

    const img = document.createElement("img");
    img.src = dataURL;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.display = "block";
    img.draggable = false;

    imgContainer.appendChild(img);

    windowElement.appendChild(windowHeader);
    windowElement.appendChild(closeButton);
    windowElement.appendChild(minimizeButton);
    windowElement.appendChild(imgContainer);
    windowsContainer.appendChild(windowElement);

    createTab(name, windowElement);

    if (activeWindow) activeWindow.classList.remove("active");
    windowElement.classList.add("active");
    activeWindow = windowElement;

    initWindowDrag(windowElement);

    // ResizeObserver to fit the window size to the container
    const resizeObserver = new ResizeObserver(() => {
      const rect = imgContainer.getBoundingClientRect();
      const headerHeight = windowElement.querySelector(".window-header").offsetHeight;
      windowElement.style.width = rect.width + "px";
      windowElement.style.height = rect.height + headerHeight + "px";
    });
    resizeObserver.observe(imgContainer);
    windowElement._container = imgContainer;
    windowElement._resizeObserver = resizeObserver;
    windowElement._isImageWindow = true;
    windowElement._imageElement = img;
  }

  function initWindowDrag(windowElement) {
    const windowHeader = windowElement.querySelector(".window-header");
    let isDragging = false;
    let dragStartX, dragStartY;
    let windowStartLeft, windowStartTop;
    let leftButtonHeld = false;

    windowHeader.style.cursor = "grab";

    windowHeader.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      leftButtonHeld = true;
      if (activeWindow !== windowElement) {
        windowElement.classList.add("active");
        if (activeWindow) activeWindow.classList.remove("active");
        activeWindow = windowElement;
      }
      if (!isPanning) {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        windowStartLeft = windowElement.offsetLeft;
        windowStartTop = windowElement.offsetTop;
        windowHeader.style.cursor = "grabbing";
      }
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging || isPanning) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      windowElement.style.left = windowStartLeft + dx + "px";
      windowElement.style.top = windowStartTop + dy + "px";
    });

    document.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        leftButtonHeld = false;
        isDragging = false;
        windowHeader.style.cursor = "grab";
      }
    });

    const onPanEnd = (mouseX, mouseY) => {
      if (leftButtonHeld) {
        isDragging = true;
        dragStartX = mouseX;
        dragStartY = mouseY;
        windowStartLeft = windowElement.offsetLeft;
        windowStartTop = windowElement.offsetTop;
        windowHeader.style.cursor = "grabbing";
        windowElement.classList.add("active");
        if (activeWindow && activeWindow !== windowElement) {
          activeWindow.classList.remove("active");
        }
        activeWindow = windowElement;
      }
    };

    windowElement._onPanEnd = onPanEnd;
  }

  function initCodeMirror(windowElement, container, filename = "") {
    const mode = getModeByFilename(filename);
    const editor = CodeMirror(container, {
      mode: mode,
      lineNumbers: true,
      value: "",
      viewportMargin: Infinity
    });
    editor.setOption("theme", "isotope");

    const wrapper = editor.getWrapperElement();
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.fontSize = `${14 * scale}px`;
    editor.refresh();

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const headerHeight = windowElement.querySelector(".window-header").offsetHeight;
      windowElement.style.width = rect.width + "px";
      windowElement.style.height = rect.height + headerHeight + "px";
      editor.refresh();
    });

    resizeObserver.observe(container);
    windowElement._editor = editor;
    windowElement._container = container;
    windowElement._resizeObserver = resizeObserver;
  }

  document.addEventListener("wheel", (e) => {
    if (e.altKey) return;
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    zoomToCursor(e.clientX, e.clientY, scale * zoomFactor);
  }, { passive: false });

  function zoomToCursor(cursorX, cursorY, newScale) {
    newScale = Math.min(Math.max(newScale, 0.5), 3);
    const factor = newScale / scale;
    scale = newScale;

    document.querySelectorAll(".window").forEach(win => {
      if (win.style.display === "none") return;
      const container = win._container;
      const rect = win.getBoundingClientRect();
      const offsetX = cursorX - rect.left;
      const offsetY = cursorY - rect.top;

      const newWidth = container.offsetWidth * factor;
      const newHeight = container.offsetHeight * factor;
      container.style.width = newWidth + "px";
      container.style.height = newHeight + "px";

      if (!win._isImageWindow) {
        // Only for CodeMirror windows
        const editor = win._editor;
        if (editor) {
          const wrapper = editor.getWrapperElement();
          wrapper.style.width = "100%";
          wrapper.style.height = "100%";
          wrapper.style.fontSize = `${14 * scale}px`;
          editor.refresh();
        }
      }
      // For images nothing needs to be done, img is always 100%

      const headerHeight = win.querySelector(".window-header").offsetHeight;
      win.style.width = container.offsetWidth + "px";
      win.style.height = container.offsetHeight + headerHeight + "px";

      const dx = offsetX * (factor - 1);
      const dy = offsetY * (factor - 1);
      win.style.left = (win.offsetLeft - dx) + "px";
      win.style.top = (win.offsetTop - dy) + "px";
    });
  }

  document.addEventListener("mousedown", (e) => {
    if (e.button === 1) {
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panX += dx;
    panY += dy;
    windowsContainer.style.transform = `translate(${panX}px, ${panY}px)`;
    startX = e.clientX;
    startY = e.clientY;
  });

  document.addEventListener("mouseup", (e) => {
    if (e.button === 1) {
      isPanning = false;
      startX = startY = null;
      document.querySelectorAll(".window").forEach(win => {
        if (win._onPanEnd) win._onPanEnd(e.clientX, e.clientY);
      });
    }
  });

  document.getElementById("createWindowBtn").addEventListener("click", () => {
    let name = prompt("Enter file name:");
    if(name) createWindow(name, "");
  });

  document.getElementById("openFileBtn").addEventListener("click", () => {
    // Accept all files
    const fileInput = document.getElementById("fileInput");
    fileInput.accept = "";
    fileInput.value = "";
    fileInput.click();
  });

  document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) => createImageWindow(file.name, e.target.result);
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => createWindow(file.name, e.target.result);
        reader.readAsText(file);
      }
    }
  });

  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) => createImageWindow(file.name, e.target.result);
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => createWindow(file.name, e.target.result);
        reader.readAsText(file);
      }
    });
  });

  document.getElementById("saveFileBtn").addEventListener("click", () => {
    const windows = Array.from(document.querySelectorAll(".window"));
    if (!windows.length) return alert("No open windows to save.");

    const choice = prompt("Enter 1 to save current file or 2 to save all files:", "1");
    if (choice !== "1" && choice !== "2") return;

    if (choice === "1") {
      if (!activeWindow) return alert("No active window to save.");
      saveWindow(activeWindow);
    } else {
      windows.forEach(win => saveWindow(win));
    }
  });

  function saveWindow(win) {
    if (win._isImageWindow && win._imageElement) {
      // Save image as file
      const filename = win.querySelector(".window-header").innerText || "image.png";
      const a = document.createElement("a");
      a.href = win._imageElement.src;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const editor = win._editor;
      const filename = win.querySelector(".window-header").innerText || "untitled.txt";
      const content = editor.getValue();
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
});