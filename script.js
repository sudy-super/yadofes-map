document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('mapContainer');
    const eventMapImage = document.getElementById('eventMap');
    let svgOverlay = null;
    let shopsData = [];
    let activeElement = null;
    let currentPopup = null;

    const POPUP_WIDTH_DESKTOP = 300;
    const POPUP_WIDTH_MOBILE = 220;
    const ARROW_WIDTH = 12;
    const POPUP_OFFSET_DESKTOP = 10;
    const POPUP_OFFSET_MOBILE = 8; 
    const SVG_NS = "http://www.w3.org/2000/svg";

    const isMobile = () => window.innerWidth <= 768;

    async function fetchShopData() {
        try {
            const response = await fetch('./assets/yado_shops.csv');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const csvText = await response.text();
            shopsData = parseCSV(csvText);
            if (eventMapImage.complete && eventMapImage.naturalWidth > 0) {
                initializeMapFeatures();
            } else {
                eventMapImage.onload = initializeMapFeatures;
                eventMapImage.onerror = () => {
                    console.error("地図画像の読み込みに失敗しました。");
                    mapContainer.innerHTML = "<p>地図画像の読み込みに失敗しました。</p>";
                };
            }
        } catch (error) {
            console.error("CSVファイルの読み込み/パースに失敗しました:", error);
            mapContainer.innerHTML = "<p>店舗情報の読み込みに失敗しました。</p>";
        }
    }

    function initializeMapFeatures() {
        if (!eventMapImage.naturalWidth || !eventMapImage.naturalHeight) {
            console.warn("地図画像のサイズ未確定。再試行します。");
            setTimeout(initializeMapFeatures, 100);
            return;
        }
        createSvgOverlay();
        createShopGroupAreas();
    }

    function createSvgOverlay() {
        if (svgOverlay) svgOverlay.remove();
        svgOverlay = document.createElementNS(SVG_NS, "svg");
        svgOverlay.classList.add("event-map-svg-overlay");
        mapContainer.appendChild(svgOverlay);
    }

    function parseCSVLine(line) {
        const fields = []; let buffer = ''; let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { buffer += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) { fields.push(buffer); buffer = ''; }
            else { buffer += char; }
        }
        fields.push(buffer); return fields;
    }

    function parseCSV(csvText) {
        const lines = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === "")) { console.warn("CSV空"); return []; }
        const headerLine = lines[0]; const rawHeaders = parseCSVLine(headerLine);
        const headers = rawHeaders.map(h => h.trim());
        const dataRows = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]; if (line.trim() === "") continue;
            const values = parseCSVLine(line);
            if (values.length !== headers.length) { console.warn(`CSV列数不一致 H:${headers.length},V:${values.length},L:"${line}"`); continue; }
            const entry = {};
            headers.forEach((header, index) => { entry[header] = values[index] ? values[index].trim() : ''; });
            dataRows.push(entry);
        } return dataRows;
    }

    const shopGroupAreasConfig = [
        { groupLabel: "1-2", type: 'rect', x1: 284, y1: 126, x2: 340, y2: 169, ids: ["1", "2"] },
        { groupLabel: "3-4", type: 'rect', x1: 284, y1: 169, x2: 340, y2: 213, ids: ["3", "4"] },
        { groupLabel: "5-6", type: 'rect', x1: 284, y1: 213, x2: 340, y2: 255, ids: ["5", "6"] },
        { groupLabel: "7-8", type: 'rect', x1: 284, y1: 255, x2: 340, y2: 299, ids: ["7", "8"] },
        { groupLabel: "9-10", type: 'rect', x1: 284, y1: 299, x2: 340, y2: 341, ids: ["9", "10"] },
        { groupLabel: "11-12", type: 'rect', x1: 284, y1: 341, x2: 340, y2: 384, ids: ["11", "12"] },
        { groupLabel: "13-14", type: 'rect', x1: 284, y1: 384, x2: 340, y2: 424, ids: ["13", "14"] },
        { groupLabel: "15-16", type: 'rect', x1: 284, y1: 424, x2: 340, y2: 469, ids: ["15", "16"] },
        { groupLabel: "17-18", type: 'rect', x1: 284, y1: 469, x2: 340, y2: 513, ids: ["17", "18"] },
        { groupLabel: "19-20", type: 'rect', x1: 284, y1: 513, x2: 340, y2: 554, ids: ["19", "20"] },
        { groupLabel: "21-22", type: 'rect', x1: 284, y1: 554, x2: 340, y2: 597, ids: ["21", "22"] },
        { groupLabel: "23-24", type: 'rect', x1: 284, y1: 597, x2: 340, y2: 641, ids: ["23", "24"] },
        { groupLabel: "25-26", type: 'rect', x1: 284, y1: 802, x2: 340, y2: 849, ids: ["25", "26"] },
        { groupLabel: "27-28", type: 'rect', x1: 284, y1: 849, x2: 340, y2: 892, ids: ["27", "28"] },
        { groupLabel: "29-30", type: 'rect', x1: 284, y1: 892, x2: 340, y2: 936, ids: ["29", "30"] },
        { groupLabel: "31-32", type: 'rect', x1: 284, y1: 936, x2: 340, y2: 979, ids: ["31", "32"] },
        { groupLabel: "33-34", type: 'rect', x1: 284, y1: 979, x2: 340, y2: 1022, ids: ["33", "34"] },
        { groupLabel: "35-36", type: 'rect', x1: 284, y1: 1022, x2: 340, y2: 1064, ids: ["35", "36"] },
        { groupLabel: "37-38", type: 'rect', x1: 284, y1: 1064, x2: 340, y2: 1106, ids: ["37", "38"] },
        { groupLabel: "39-40", type: 'rect', x1: 284, y1: 1106, x2: 340, y2: 1151, ids: ["39", "40"] },
        { groupLabel: "41-42", type: 'rect', x1: 284, y1: 1151, x2: 340, y2: 1193, ids: ["41", "42"] },
        { groupLabel: "43-44", type: 'rect', x1: 284, y1: 1193, x2: 340, y2: 1236, ids: ["43", "44"] },
        { groupLabel: "45-46", type: 'rect', x1: 284, y1: 1236, x2: 340, y2: 1280, ids: ["45", "46"] },
        { groupLabel: "47-48", type: 'polygon', points: [{x:611,y:325},{x:578,y:368},{x:614,y:397},{x:648,y:354}], ids: ["47", "48"] },
        { groupLabel: "49-50", type: 'polygon', points: [{x:648,y:354},{x:614,y:397},{x:648,y:423},{x:681,y:381}], ids: ["49", "50"] },
        { groupLabel: "51-52", type: 'polygon', points: [{x:681,y:381},{x:648,y:423},{x:684,y:451},{x:716,y:409}], ids: ["51", "52"] },
        { groupLabel: "53-54", type: 'polygon', points: [{x:716,y:409},{x:684,y:451},{x:719,y:478},{x:751,y:438}], ids: ["53", "54"] },
        { groupLabel: "55-56", type: 'polygon', points: [{x:751,y:438},{x:719,y:478},{x:755,y:506},{x:787,y:467}], ids: ["55", "56"] },
        { groupLabel: "57-58", type: 'polygon', points: [{x:787,y:467},{x:755,y:506},{x:789,y:533},{x:821,y:494}], ids: ["57", "58"] },
        { groupLabel: "59-60", type: 'polygon', points: [{x:821,y:494},{x:789,y:533},{x:826,y:561},{x:856,y:523}], ids: ["59", "60"] },
        { groupLabel: "61-62", type: 'polygon', points: [{x:856,y:523},{x:826,y:561},{x:864,y:590},{x:893,y:553}], ids: ["61", "62"] }
    ];

    function createShopGroupAreas() {
        const mapDisplayWidth = eventMapImage.offsetWidth;
        const mapDisplayHeight = eventMapImage.offsetHeight;
        const mapNaturalWidth = eventMapImage.naturalWidth;
        const mapNaturalHeight = eventMapImage.naturalHeight;
        if (!mapNaturalWidth || !mapNaturalHeight) { console.error("地図画像の元サイズが0です。"); return; }
        const scaleX = mapDisplayWidth / mapNaturalWidth;
        const scaleY = mapDisplayHeight / mapNaturalHeight;
        while (svgOverlay.firstChild) { svgOverlay.removeChild(svgOverlay.firstChild); }
        mapContainer.querySelectorAll('.shop-group-area').forEach(el => el.remove());
        shopGroupAreasConfig.forEach(areaConfig => {
            let areaElement;
            if (areaConfig.type === 'polygon' && areaConfig.points) {
                areaElement = document.createElementNS(SVG_NS, "polygon");
                areaElement.classList.add('shop-polygon-area');
                const scaledPoints = areaConfig.points.map(p => `${p.x*scaleX},${p.y*scaleY}`).join(" ");
                areaElement.setAttribute("points", scaledPoints);
                areaElement.dataset.groupIds = areaConfig.ids.join(',');
                svgOverlay.appendChild(areaElement);
                // SVGテキストラベルはCSSで非表示にしているので、JSでの生成は不要
                /*
                const textLabel = document.createElementNS(SVG_NS, "text");
                textLabel.classList.add('shop-polygon-label');
                // textLabel.textContent = areaConfig.groupLabel; // 非表示
                let sumX=0, sumY=0; areaConfig.points.forEach(p=>{sumX+=p.x; sumY+=p.y;});
                const centerX = (sumX/areaConfig.points.length)*scaleX;
                const centerY = (sumY/areaConfig.points.length)*scaleY;
                textLabel.setAttribute("x",centerX); textLabel.setAttribute("y",centerY);
                svgOverlay.appendChild(textLabel);
                */
            } else {
                areaElement = document.createElement('div');
                areaElement.classList.add('shop-group-area');
                areaElement.dataset.groupIds = areaConfig.ids.join(',');
                // areaElement.textContent = areaConfig.groupLabel; // HTML divのテキストも非表示
                const left = areaConfig.x1*scaleX; const top = areaConfig.y1*scaleY;
                const width = (areaConfig.x2-areaConfig.x1)*scaleX;
                const height = (areaConfig.y2-areaConfig.y1)*scaleY;
                areaElement.style.left = `${left}px`; areaElement.style.top = `${top}px`;
                areaElement.style.width = `${width}px`; areaElement.style.height = `${height}px`;
                mapContainer.appendChild(areaElement);
            }
            if(areaElement){
                areaElement.addEventListener('click', (event)=>{event.stopPropagation(); handleAreaClick(areaElement, areaConfig.ids);});
            }
        });
    }

    function handleAreaClick(clickedElement, shopIds) {
        if(activeElement === clickedElement && currentPopup){ closeCurrentPopup(); return; }
        closeCurrentPopup();
        activeElement = clickedElement; activeElement.classList.add('active');
        const shopInfos = shopIds.map(id => shopsData.find(shop => String(shop['No.']) === String(id))).filter(Boolean);
        if(shopInfos.length === 0){
            console.warn(`店舗情報なし。IDs: ${shopIds.join(',')}`);
            displayNoInfoPopup(clickedElement, shopIds);
        } else if (shopInfos.length < shopIds.length){
            const f=shopInfos.map(s=>s['No.']); const m=shopIds.filter(id=>!f.includes(String(id)));
            console.warn(`一部情報のみ。要求:${shopIds.join(',')},発見:${f.join(',')},不明:${m.join(',')}`);
            displayShopInfoPopup(shopInfos, clickedElement);
        } else {
            displayShopInfoPopup(shopInfos, clickedElement);
        }
    }

    function displayNoInfoPopup(targetElement, shopIds) {
        currentPopup = document.createElement('div');
        currentPopup.classList.add('shop-info-popup');
        currentPopup.style.width = '220px';
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('shop-info-popup-content');
        contentDiv.innerHTML = `<p>店舗番号 ${shopIds.join(' と ')} の<br>詳細情報は見つかりませんでした。</p>`;
        currentPopup.appendChild(contentDiv);
        mapContainer.appendChild(currentPopup);
        positionAndShowPopup(currentPopup, targetElement, null);
    }

    function extractUsernameFromUrl(url, platform) {
        if (!url || typeof url !== 'string' || url.trim() === '') return null;
        try {
            const fullUrl = url.startsWith('//') ? `https:${url}` : url;
            const parsedUrl = new URL(fullUrl);
            let username = null;
            const pathParts = parsedUrl.pathname.split('/').filter(part => part !== '');
            if (platform === 'twitter' && (parsedUrl.hostname === 'x.com' || parsedUrl.hostname === 'twitter.com')) {
                if (pathParts.length > 0) username = pathParts[0];
            } else if (platform === 'instagram' && parsedUrl.hostname.includes('instagram.com')) {
                if (pathParts.length > 0) {
                     username = pathParts[0];
                     if (username) username = username.split(/[?#]/)[0];
                }
            }
            if (username && (username.includes('.') || username.includes('/'))) {
                const simpleMatch = fullUrl.match(/(?:x\.com|twitter\.com|instagram\.com)\/([a-zA-Z0-9_]+)/);
                if (simpleMatch && simpleMatch[1]) return `@${simpleMatch[1]}`;
                return null;
            }
            return username ? `@${username}` : null;
        } catch (e) {
            console.warn(`SNS URLパース/抽出失敗: ${url}`, e);
            const parts = url.split('/'); let lastPart = parts.pop();
            while(lastPart==='' && parts.length > 0){ lastPart = parts.pop(); }
            if (lastPart) {
                const usernameCandidate = lastPart.split(/[?#]/)[0];
                if (usernameCandidate && !usernameCandidate.includes('.')) return `@${usernameCandidate}`;
            }
            return null;
        }
    }

    function displayShopInfoPopup(infos, targetElement) {
        currentPopup = document.createElement('div');
        currentPopup.classList.add('shop-info-popup');
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('shop-info-popup-content');

        infos.forEach(shop => {
            const detailBlock = document.createElement('div');
            detailBlock.classList.add('shop-details-block');
            let snsHtml = '';
            const twitterUrl = shop['Twitter'] ? shop['Twitter'].trim() : null;
            const instagramUrl = shop['Instagram'] ? shop['Instagram'].trim() : null;
            const twitterUsername = extractUsernameFromUrl(twitterUrl, 'twitter');
            const instagramUsername = extractUsernameFromUrl(instagramUrl, 'instagram');

            if (twitterUsername && twitterUrl) {
                snsHtml += `<div class="sns-item"><a href="${twitterUrl.startsWith('//') ? 'https:'+twitterUrl : twitterUrl}" target="_blank" rel="noopener noreferrer" class="sns-link"><img src="./assets/twitter.svg" alt="X/Twitter Icon" class="sns-icon"><span class="sns-username">${twitterUsername}</span></a></div>`;
            }
            if (instagramUsername && instagramUrl) {
                snsHtml += `<div class="sns-item"><a href="${instagramUrl.startsWith('//') ? 'https:'+instagramUrl : instagramUrl}" target="_blank" rel="noopener noreferrer" class="sns-link"><img src="./assets/instagram.svg" alt="Instagram Icon" class="sns-icon"><span class="sns-username">${instagramUsername}</span></a></div>`;
            }
            if (snsHtml === '') { snsHtml = '<p class="no-sns">SNS情報なし</p>'; }
            const shusseibi = shop['出店日'] && shop['出店日'].trim() !== '' ? `<p><strong>出店日:</strong> ${shop['出店日']}</p>` : '';
            detailBlock.innerHTML = `<h3>${shop['店名']||'店名なし'} <span class="shop-number">(No.${shop['No.']})</span></h3><p><strong>団体:</strong> ${shop['団体']||'情報なし'}</p><p><strong>品目:</strong> ${shop['品目']||'情報なし'}</p><p><strong>区分:</strong> ${shop['区分']||'情報なし'}</p>${shusseibi}${snsHtml}`;
            contentDiv.appendChild(detailBlock);
        });
        currentPopup.appendChild(contentDiv);
        const arrowDiv = document.createElement('div');
        arrowDiv.classList.add('popup-arrow');
        currentPopup.appendChild(arrowDiv);
        mapContainer.appendChild(currentPopup);
        positionAndShowPopup(currentPopup, targetElement, arrowDiv);
    }

    function positionAndShowPopup(popupElement, targetElement, arrowElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const targetTopInContainer = targetRect.top - containerRect.top + mapContainer.scrollTop;
        const targetLeftInContainer = targetRect.left - containerRect.left + mapContainer.scrollLeft;
        const targetWidth = targetRect.width; const targetHeight = targetRect.height;
        let popupLeft, popupTop; let arrowClass = 'arrow-left';
        
        const currentPopupDesignatedWidth = isMobile() ? POPUP_WIDTH_MOBILE : POPUP_WIDTH_DESKTOP;
        const currentOffset = isMobile() ? POPUP_OFFSET_MOBILE : POPUP_OFFSET_DESKTOP;
        let actualPopupWidth = parseFloat(window.getComputedStyle(popupElement).width);
        if (isNaN(actualPopupWidth) || actualPopupWidth === 0) actualPopupWidth = currentPopupDesignatedWidth;

        if (targetRect.right + currentOffset + actualPopupWidth + (arrowElement ? ARROW_WIDTH : 0) < window.innerWidth) {
            popupLeft = targetLeftInContainer + targetWidth + currentOffset;
            arrowClass = 'arrow-left';
        } else if (targetRect.left - currentOffset - actualPopupWidth - (arrowElement ? ARROW_WIDTH : 0) > 0) {
            popupLeft = targetLeftInContainer - actualPopupWidth - currentOffset - (arrowElement ? ARROW_WIDTH : 0);
            arrowClass = 'arrow-right';
        } else {
            popupLeft = targetLeftInContainer + targetWidth + currentOffset;
            if (popupLeft + actualPopupWidth > window.innerWidth - 10) {
                popupLeft = window.innerWidth - actualPopupWidth - 10;
                 if (popupLeft < targetLeftInContainer + targetWidth ) {
                     popupLeft = targetLeftInContainer - actualPopupWidth - currentOffset - (arrowElement ? ARROW_WIDTH:0) ;
                     if(popupLeft < 10) popupLeft = 10;
                     arrowClass = 'arrow-right';
                 } else {  arrowClass = 'arrow-left'; }
            }
        }
        
        popupElement.style.visibility = 'hidden'; popupElement.classList.add('visible');
        const popupHeight = popupElement.offsetHeight;
        popupElement.classList.remove('visible'); popupElement.style.visibility = '';
        popupTop = targetTopInContainer + (targetHeight / 2) - (popupHeight / 2);
        const csT = mapContainer.scrollTop, csL = mapContainer.scrollLeft;
        const ccH = mapContainer.clientHeight, ccW = mapContainer.clientWidth;

        if(popupTop < csT) popupTop = csT + 5;
        else if(popupTop + popupHeight > csT + ccH) popupTop = csT + ccH - popupHeight - 5;

        if (isMobile()) {
            const popupBottom = popupTop + popupHeight;
            const targetBottomInContainer = targetTopInContainer + targetHeight;
            if (popupTop < targetBottomInContainer && popupBottom > targetTopInContainer) {
                if (targetTopInContainer - popupHeight - currentOffset > csT) {
                    popupTop = targetTopInContainer - popupHeight - currentOffset;
                } else if (targetBottomInContainer + currentOffset + popupHeight < csT + ccH) {
                    popupTop = targetBottomInContainer + currentOffset;
                }
            }
        }

        if(popupLeft < csL) popupLeft = csL + 5;
        else if(popupLeft + actualPopupWidth > csL + ccW) popupLeft = csL + ccW - actualPopupWidth - 5;
        popupElement.style.top = `${popupTop}px`; popupElement.style.left = `${popupLeft}px`;
        if(arrowElement){
            arrowElement.className = 'popup-arrow'; arrowElement.classList.add(arrowClass);
            const arrVPos = (targetTopInContainer + targetHeight / 2) - popupTop;
            const clampArrTop = Math.max(10, Math.min(arrVPos - 10, popupHeight - 30));
            arrowElement.style.top = `${clampArrTop}px`;
        }
        requestAnimationFrame(() => { popupElement.classList.add('visible'); });
    }

    function closeCurrentPopup() {
        if (currentPopup) {
            currentPopup.classList.remove('visible');
            setTimeout(() => { if (currentPopup && !currentPopup.classList.contains('visible')) currentPopup.remove(); }, 200);
            currentPopup = null;
        }
        if (activeElement) {
            activeElement.classList.remove('active');
            activeElement = null;
        }
    }

    document.addEventListener('click', (event) => {
        if (currentPopup && activeElement) {
            const isClickInsidePopup = currentPopup.contains(event.target);
            let isClickInsideActiveArea = false;
            if (activeElement.contains) { 
                isClickInsideActiveArea = activeElement.contains(event.target);
            } else if (event.target.correspondingUseElement) { 
                 isClickInsideActiveArea = activeElement === event.target.correspondingUseElement.parentElement || (activeElement.contains && activeElement.contains(event.target.correspondingUseElement));
            } else { 
                isClickInsideActiveArea = activeElement === event.target;
            }
            if (!isClickInsidePopup && !isClickInsideActiveArea) closeCurrentPopup();
        }
    });
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        closeCurrentPopup();
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (eventMapImage.complete && shopsData.length > 0 && svgOverlay && eventMapImage.naturalWidth > 0) {
                 initializeMapFeatures();
            }
        }, 250);
    });

    fetchShopData();
});