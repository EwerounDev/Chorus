class SecureDOM {
    static setContent(element, content, isHTML = false) {
        if (!element) return;

        if (isHTML) {
            if (typeof DOMPurify !== 'undefined') {
                element.innerHTML = DOMPurify.sanitize(content);
            } else {
                this.setContentSafely(element, content);
            }
        } else {
            element.textContent = content;
        }
    }

    static setContentSafely(element, htmlContent) {
        element.innerHTML = '';

        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;

        while (temp.firstChild) {
            element.appendChild(temp.firstChild);
        }
    }

    static createElement(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);

        Object.keys(attributes).forEach(key => {
            if (key.startsWith('on')) {
                console.warn('Event handlers are not allowed for security reasons');
                return;
            }
            element.setAttribute(key, attributes[key]);
        });

        if (content) {
            this.setContent(element, content, false);
        }

        return element;
    }

    static addClasses(element, ...classes) {
        if (!element) return;
        classes.forEach(className => {
            if (typeof className === 'string' && className.trim()) {
                element.classList.add(className.trim());
            }
        });
    }

    static removeClasses(element, ...classes) {
        if (!element) return;
        classes.forEach(className => {
            if (typeof className === 'string' && className.trim()) {
                element.classList.remove(className.trim());
            }
        });
    }
}

window.SecureDOM = SecureDOM;
