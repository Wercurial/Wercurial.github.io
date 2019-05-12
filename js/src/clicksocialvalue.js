(function() {
    var coreSocialistValues = ["可爱","漂亮","温柔","善良","纯真","勇敢","帅气","大方","英俊","潇洒","淳朴","天真","单纯","俊俏","真诚","无私","正直","慷慨"],
    index = Math.floor(Math.random() * coreSocialistValues.length);
	
    document.body.addEventListener('click',
    function(e) {
	// 过滤 a 标签
         if (e.target.tagName == 'A') {
            return;
        }
        var x = e.pageX,
        y = e.pageY,
        span = document.createElement('span');
        span.textContent = coreSocialistValues[index];
        index = (index + 1) % coreSocialistValues.length;
        span.style.cssText = ['z-index: 9999999; position: absolute; font-weight: bold; color: #ff6651; top: ', y - 20, 'px; left: ', x, 'px;'].join('');
        document.body.appendChild(span);
        animate(span);
    });
    function animate(el) {
        var i = 0,
        top = parseInt(el.style.top),
        id = setInterval(frame, 16.7);
        function frame() {
            if (i > 180) {
                clearInterval(id);
                el.parentNode.removeChild(el);
            } else {
                i += 2;
                el.style.top = top - i + 'px';
                el.style.opacity = (180 - i) / 180;
            }
        }
    }
} ());