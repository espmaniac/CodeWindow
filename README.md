# <p align="center">CodeWindow</p>
<p align="center"><img src="https://github.com/espmaniac/CodeWindow/blob/main/favicon.svg" width="200" height="200" /></p>
*Created with [ChatGPT](https://chat.openai.com)*

**CodeWindow Editor** is a web-based code editor featuring multiple draggable windows, tabs, and syntax highlighting for various programming languages. Open, edit, save, and manage multiple files simultaneously, all directly in your browser.

---

## Features

- **Create new windows and tabs**
  - Click the **"New File"** button and enter a file name to open a new editor window.
  - Each window automatically gets its own tab in the top panel.

- **Open files from your computer**
  - Click **"Open File"** to select a file from your system.
  - Drag and drop files directly into the browser window.

- **Syntax-highlighted code editing**
  - Supported languages: JavaScript, C, C++, Python, Java, C#, Go, Ruby, HTML, CSS, JSON, XML, and more.
  - Syntax highlighting is automatically detected by file extension.

- **Window management**
  - **Move:** drag the window by its header.
  - **Resize:** drag the corners of the editor inside the window.
  - **Minimize:** `_` button hides the window; its tab shows as minimized.
  - **Close:** `X` button closes the window and its tab.

- **Tabs**
  - Click a tab to activate the corresponding window.
  - Click minimized tabs to restore their windows.

- **Panning**
  - Hold the **middle mouse button** (wheel) and move the mouse to pan all windows.

- **Zooming**
  - Use the mouse wheel to zoom in/out the windows and font.
  - Zoom is centered on the cursor position.

- **Save files**
  - **Save File** button options:
    1. Save the active window.
    2. Save all open windows.
  - Files are downloaded locally via the browser.

---

## Quick Actions

| Action | How to do it |
|--------|--------------|
| Create new window | Click **New File**, enter a file name |
| Open file | Click **Open File** or drag file into window |
| Save active window | Click **Save File**, choose option 1 |
| Save all windows | Click **Save File**, choose option 2 |
| Minimize window | Click `_` button |
| Close window | Click `X` button |
| Drag window | Hold the header and move the mouse |
| Pan all windows | Hold middle mouse button and move |
| Zoom | Scroll mouse wheel |
| Switch tabs | Click on a tab |

---

## Technical Details

- Uses **CodeMirror** as the code editor.  
- Supports dynamic window resizing and font scaling.  
- Automatically detects programming language based on file extension.  

---

## Screenshot

![Screenshot Example](https://github.com/espmaniac/CodeWindow/blob/main/screenshot.png)

---
