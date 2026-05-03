const avatar = document.getElementById('avatar');
const html = document.documentElement;
const styles = window.getComputedStyle(document.documentElement);
const qrcodeOverlay = document.getElementById('overlay');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// 返回首选主题，优先使用本地保存的设置
async function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) {
        return stored;
    }
    return prefersDarkScheme.matches ? 'dark' : 'light';
}
/**
 * 当前展示的二维码文本，点击二维码后会被置为 null。
 * 用于在 avatar 被点击时重新生成相同的二维码，或在遮罩关闭时清除。
 */
let qrcodeURL = null;
// 当前生成的二维码对应的中心图标（SVG 或默认头像）
let currentQRIcon = null;
// 不使用持久化存储，仅在运行时保存最近的二维码图标
// 当前页面切换时，updateAvatar 会使用 global 变量 currentQRIcon


function updateAvatar(theme) {
	if (!qrcodeOverlay.hidden && qrcodeURL != null) {
		// 重新生成二维码时使用之前的图标
		generateQRCode(qrcodeURL, currentQRIcon);
	} else {
		avatar.src = theme === 'dark' ? 'black.jpg' : 'white.jpg';
	}
}

function showOverlay() {
    qrcodeOverlay.hidden = false;
};

/**
 * 从 links.json 加载链接配置并在页面上动态创建按钮。
 * 对于需要生成二维码的项（qr 为 true），点击时调用 generateQRCode；
 * 其它项直接打开对应的 URL。
 */
async function loadLinks() {
    const respLinks = await fetch('links.json');
    const config = await respLinks.json();
    const container = document.getElementById('linkContainer');
    if (!container) return;
    for (const item of config) {
        const a = document.createElement('a');
        a.className = 'link';
        // 对于需要生成二维码的链接，不设置实际跳转地址
        a.href = item.qr ? '#' : item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        // 内联加载 SVG 内容
        try {
            const respIcon = await fetch(item.icon);
            const svgText = await respIcon.text();
            a.innerHTML = svgText;
        } catch (e) {
            console.error('SVG 加载失败:', e);
        }
        if (item.qr) {
            a.addEventListener('click', (e) => {
                // 阻止默认链接行为，仅生成二维码
                e.preventDefault();
                generateQRCode(item.url, item.icon);
            });
        }
        container.appendChild(a);
    }
}

function hideOverlay() {
	qrcodeOverlay.hidden = true;
};

async function handleThemeChange() {
    const newTheme = await getPreferredTheme();
    html.setAttribute('data-theme', newTheme);
    updateAvatar(newTheme);
};

function blobToDataURL(blob, callback) {
	const reader = new FileReader();
	reader.onload = function(e) {
		callback(e.target.result);
	};
	reader.readAsDataURL(blob);
}

async function generateQRCode(text, icon) {
    const currentTheme = html.getAttribute('data-theme');
    currentQRIcon = icon ? icon : null;

    let imageSrc = icon;
    if (icon && icon.endsWith('.svg')) {
        try {
            const resp = await fetch(icon);
            let svgText = await resp.text();
            const themeColor = styles.getPropertyValue('--text-color').trim();
            svgText = svgText.replace(/<svg([^>]*)stroke="[^"]*"([^>]*)>/i, `<svg$1stroke="${themeColor}"$2>`);
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            imageSrc = URL.createObjectURL(blob);
        } catch (e) {
            console.error('SVG 处理失败:', e);
            imageSrc = null;
        }
    }

    let qrcode;
    try {
        qrcode = new QRCodeStyling({
            data: text,
            image: imageSrc ? imageSrc : (currentTheme === 'dark' ? 'black.jpg' : 'white.jpg'),
            shape: "square",
            width: 800,
            height: 800,
            margin: 40,
            qrOptions: {
                "typeNumber": 0,
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
    } catch (e) {
        console.error("QRCode 初始化失败:", e);
        avatar.src = currentTheme === 'dark' ? 'black.jpg' : 'white.jpg';
        return;
    }
    try {
        qrcode.getRawData("png").then((buffer) => {
            avatar.src = URL.createObjectURL(buffer);
            showOverlay();
            qrcodeURL = text;
            // 不做持久化存储，仅在内存中保存当前图标
        });
    } catch (e) {
        console.error("生成失败:", e);
        avatar.src = currentTheme === 'dark' ? 'black.jpg' : 'white.jpg';
    }
}

function loadingOverlayDestroy() {
	const loadingOverlay = document.getElementById('loading');
	const loader = this.document.getElementById('loader');
	document.fonts.ready.then(function() {
		if (loadingOverlay) {
			loader.classList.add('stop');
			setTimeout(() => {
				loadingOverlay.style.opacity = 0;
			}, 250);
			setTimeout(() => {
				loadingOverlay.remove();
			}, 750);
		}
	});
};


document.addEventListener('DOMContentLoaded', function() {
	main();
});

function main() {
	fetch('https://api.github.com/users/gfk-sveyigey')
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			return response.json();
		})
		.then(data => {
			if (data.name === undefined || data.bio === undefined) {
				throw new Error("数据格式异常");
			}
			const nameElement = document.getElementById("name");
			const bioElement = document.getElementById("bio");
			nameElement.textContent = data.name;
			bioElement.textContent = data.bio;
		})
		.catch(error => {
			console.error("加载失败:", error);
		})
		.finally(() => {
			loadingOverlayDestroy();
		});


	// 清除可能残留的主题设置
	if (localStorage.getItem('theme')) {
	    localStorage.removeItem('theme');
	}
	(async () => {
	    const initTheme = await getPreferredTheme();
	    html.setAttribute('data-theme', initTheme);
	    updateAvatar(initTheme);
	})();

	prefersDarkScheme.addEventListener('change', handleThemeChange);

	document.addEventListener('visibilitychange', handleThemeChange);

	window.addEventListener('pageshow', handleThemeChange);

	hideOverlay();
	// 动态加载链接配置并生成按钮
	loadLinks();

	avatar.addEventListener('click', () => {
		const currentTheme = html.getAttribute('data-theme');
		const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

		html.setAttribute('data-theme', newTheme);
		localStorage.setItem('theme', newTheme);
		updateAvatar(newTheme);
	});

	qrcodeOverlay.addEventListener('click', () => {
	    const currentTheme = html.getAttribute('data-theme');
	    hideOverlay();
	    qrcodeURL = null;
	    // 清除已保存的二维码信息，避免页面返回时恢复旧图标
	    localStorage.removeItem('qrcodeURL');
	    localStorage.removeItem('qrcodeIcon');
	    updateAvatar(currentTheme);
	});
};