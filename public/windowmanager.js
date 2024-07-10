let i = 0;

document.addEventListener('mousedown', function (e) {
  const target = e.target.closest('.draggableDiv');
  if (target) {
    const resizer = target.querySelector('.resizer');
    makeResizableAndDraggable(target, resizer);
    handleMouseDown(target, e);
  }
});

document.addEventListener('mousemove', function (e) {
 // handleMouseMove(e);
});

document.addEventListener('mouseup', function () {
  handleMouseUp();
});

function handleMouseDown(element, e) {
  element.isDragging = true;
  element.isResizing = false;

  const offsetX = e.clientX - element.getBoundingClientRect().left;
  const offsetY = e.clientY - element.getBoundingClientRect().top;

  bringToFront(element);

  if (e.target.classList.contains('resizer')) {
    element.isResizing = true;
    element.resizeHandle = e.target;
    element.originalMouseX = e.clientX;
    element.originalMouseY = e.clientY;
    element.originalWidth = element.offsetWidth;
    element.originalHeight = element.offsetHeight;
  }

  element.offsetX = offsetX;
  element.offsetY = offsetY;
}

function handleMouseUp() {
  const allDivs = document.querySelectorAll('.draggableDiv');
  allDivs.forEach(element => {
    element.isDragging = false;
    element.isResizing = false;
  });
}

function bringToFront(element) {
  const allDivs = document.querySelectorAll('.draggableDiv');
  allDivs.forEach(div => {
    div.style.zIndex = 0;
  });

  element.style.zIndex = 1;
}

function hideframe(resizerId) {
  const frameId = resizerId.replace('resizer', '');
  const frame = document.getElementById(`floatingwindow${frameId}`).querySelector('.appframe');

  if (frame) {
    if (frame.style.display !== 'none') {
      frame.style.display = 'none';
    }
  }
}



function makeResizableAndDraggable(element, resizer) {
    let isResizing = false;
    let originalMouseX, originalMouseY, originalWidth, originalHeight, initialTop, initialLeft, offsetX, offsetY;
  
    resizer.addEventListener('mousedown', function (e) {
      isResizing = true;
      originalMouseX = e.clientX;
      originalMouseY = e.clientY;
      originalWidth = element.offsetWidth;
      originalHeight = element.offsetHeight;
      initialTop = element.offsetTop;
      initialLeft = element.offsetLeft;
  
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  
    element.addEventListener('mousedown', function (e) {
      element.isResizing = false;
      offsetX = e.clientX - element.getBoundingClientRect().left;
      offsetY = e.clientY - element.getBoundingClientRect().top;
  
      bringToFront(element);
      hideIframeDuringDrag(element);
  
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  
    function handleMouseMove(e) {
      if (isResizing) {
        const deltaX = e.clientX - originalMouseX;
        const deltaY = e.clientY - originalMouseY;
  
        const newWidth = Math.max(originalWidth + deltaX, 100);
        const newHeight = Math.max(originalHeight + deltaY, 100);
  
        element.style.width = newWidth + 'px';
        element.style.height = newHeight + 'px';
  
        // Maintain the initial top and left styles
        element.style.top = initialTop + 'px';
        element.style.left = initialLeft + 'px';
      } else if (element.isDragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
  
        element.style.left = x + 'px';
        element.style.top = y + 'px';
      }
    }
  
    function handleMouseUp() {
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
  
      // Show the iframe when resizing or dragging stops
      showIframe(element);
    }
  
    function bringToFront(element) {
      const allDivs = document.querySelectorAll('.draggableDiv');
      allDivs.forEach(div => {
        div.style.zIndex = 0;
      });
  
      element.style.zIndex = 1;
    }
  

    function hideIframeDuringDrag(element) {
        const frame = element.querySelector('.appframe');
        if (frame) {
          frame.classList.add('hidden');
        }
      }
      
      function showIframe(element) {
        const frame = element.querySelector('.appframe');
        if (frame) {
          frame.classList.remove('hidden');
        }
      }
  }

var appcontentdict = {}
appcontentdict['login'] = `<div class="popup" id="logincontainer">
                            <input type="text" id="namecontainer">
                            <input type="text" id="passcontainer">
                            <input type="text" id="colorcontainer">
                            <button type="submit"id='submitname'>submit</button>
                        </div>`

appcontentdict['inventory'] = `<div class='menu' id='inventorycontainer'></div>`


function makenewwindow(content, appname) {
    let newwindow = `<div class="draggableDiv" id="floatingwindow${i}">
                        <div class="topnav" id='topnav${i}'>
                            <div onclick="deletewindow('${i}')" id="topnavexit"><i class="fa-solid fa-xmark"></i></div>
                            <div onclick="minimisewindow('${i}')" id="topnavminimise"><i class="fa-solid fa-minus"></i></div>
                            <div onclick="maximisewindow('${i}')" id="topnavmaximise"><i class="fa-solid fa-maximize"></i></div>
                            <div class='appname' id='appname${i}'>${appname}</div>
                        </div>
                        <div class='appcontent' id='appcontent${i}'>${appcontentdict[content]}</div>
                        <div class="resizer bottom-right-resize" id="resizer${i}"></div>
                    </div>`;
  document.getElementById('windowcontainer').innerHTML += newwindow;

  const floatingwindow = document.getElementById(`floatingwindow${i}`);
  const resizer = document.getElementById(`resizer${i}`);

  makeResizableAndDraggable(floatingwindow, resizer);
  i++;
}

function deletewindow(window) {
    let deletedwindow = document.getElementById(`floatingwindow${window}`)
    deletedwindow.style.transition = 'all 0.1s'
    deletedwindow.style.opacity = '0'
    setTimeout(() => {
          deletedwindow.remove()
          console.log('e')
    }, 100);

}