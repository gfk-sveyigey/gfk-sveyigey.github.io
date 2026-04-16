const avatar = document.getElementById('avatar');
const html = document.documentElement;
const styles = window.getComputedStyle(document.documentElement);
const overlay = document.getElementById('overlay');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
let qrcodeURL = null;


function updateAvatar(theme) {
    if (!overlay.hidden && qrcodeURL != null) {
        generateQRCode(qrcodeURL);
    } else {
        avatar.src = theme === 'dark' ? 'black.jpg' : 'white.jpg';
    };
}

function showOverlay() {
    overlay.hidden = false; 
};

function hideOverlay() {
    overlay.hidden = true; 
};

function handleThemeChange() {
    if (!localStorage.getItem('theme')) {
        const newTheme = prefersDarkScheme.matches ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        updateAvatar(newTheme);
    }
};

function blobToDataURL(blob, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    callback(e.target.result);
  };
  reader.readAsDataURL(blob);
}

function generateQRCode(text) {
    const currentTheme = html.getAttribute('data-theme');
    const qrcode = new QRCodeStyling({
        data: text,
        image: currentTheme === 'dark' ? 'black.jpg' : 'white.jpg',
        shape: "square",
        width: 800,
        height: 800,
        margin: 40,
        qrOptions: {
            "typeNumber": "5",
            "mode": "Byte",
            "errorCorrectionLevel": "Q"
        },
        imageOptions: {
            saveAsBlob: true,
            hideBackgroundDots: true,
            imageSize: 0.3,
            margin: 10,
        },
        dotsOptions: {
            type: "rounded",
            color: styles.getPropertyValue('--text-color'),
            roundSize: true
        },
        backgroundOptions: {
            color: "transparent "
        },
        cornersSquareOptions: {
            type: "extra-rounded",
            color: styles.getPropertyValue('--text-color'),
            gradient: null
        },
        cornersDotOptions: {
            type: "dot",
            color: styles.getPropertyValue('--text-color'),
            gradient: null
        }
    });

    try {
        qrcode.getRawData("png").then((buffer) => {
            avatar.src = URL.createObjectURL(buffer);
            showOverlay();
            qrcodeURL = text;
        });
    } catch (e) {
        console.error("生成失败:", e);
    }
}


if (localStorage.getItem('theme')) {
    localStorage.removeItem('theme');
}

if (prefersDarkScheme.matches) {
    html.setAttribute('data-theme', 'dark');
    updateAvatar('dark');
} else {
    updateAvatar('light');
}

prefersDarkScheme.addEventListener('change', handleThemeChange);

document.addEventListener('visibilitychange', handleThemeChange);

window.addEventListener('pageshow', handleThemeChange);

hideOverlay();

avatar.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateAvatar(newTheme);
});

overlay.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    hideOverlay();
    qrcodeURL = null;
    updateAvatar(currentTheme);
});
