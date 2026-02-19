const fs = require('fs');
const path = require('path');
const https = require('https');

// YouTube Channel ID for @najonwooltari
const CHANNEL_ID = 'UCXoxs0s7ZuzS9pfikqB0DHg';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const DATA_FILE = path.join(__dirname, 'data.js');

/**
 * Fetch RSS Feed
 */
function fetchRSS() {
    return new Promise((resolve, reject) => {
        https.get(RSS_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * Simple XML Parser for YouTube RSS
 */
function parseRSS(xml) {
    const entries = [];
    const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);

    for (const match of entryMatches) {
        const entry = match[1];
        const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)[1];
        const title = entry.match(/<title>(.*?)<\/title>/)[1];
        // RSS doesn't have the full desc, but we can get it or use a default
        entries.push({ videoId, title });
    }
    return entries;
}

/**
 * Categorize Video
 */
function categorize(video) {
    const title = video.title;
    let category = {
        episode: 0,
        lang: 'ko',
        videoId: video.videoId,
        title: title,
        desc: ''
    };

    // OST / MV check
    if (title.includes('OST') || title.includes('M/V') || title.includes('MV')) {
        category.lang = 'ost';
        // Extract episode from OST title if possible (e.g., "19화 - ...")
        const epMatch = title.match(/(\d+)화/);
        category.episode = epMatch ? parseInt(epMatch[1]) : 0;
        category.desc = '웨민소 찬양';
        return category;
    }

    // Language check
    if (title.toLowerCase().includes('wsc') || title.toLowerCase().includes('westminster')) {
        category.lang = 'en';
    } else if (title.includes('第')) {
        category.lang = 'zh';
    }

    // Episode extraction
    const epMatch = title.match(/(?:EP|제|第)\.?\s?(\d+)/i);
    category.episode = epMatch ? parseInt(epMatch[1]) : (title.match(/(\d+)화/) ? parseInt(title.match(/(\d+)화/)[1]) : 0);

    // Simple description based on title
    if (title.includes('제')) {
        category.desc = title.split(']')[1] || title;
    }

    return category;
}

async function sync() {
    console.log('🔄 유튜브에서 최신 웨민소 영상을 불러오는 중...');

    try {
        const xml = await fetchRSS();
        const rawVideos = parseRSS(xml);
        const newVideos = rawVideos.map(categorize).filter(v =>
            v.title.includes('웨민소') || v.title.includes('소요리문답') || v.lang === 'en' || v.lang === 'zh'
        );

        console.log(`✅ ${newVideos.length}개의 영상을 찾았습니다.`);

        let dataContent = fs.readFileSync(DATA_FILE, 'utf8');

        // Find the videoData array in data.js
        const videoDataMatch = dataContent.match(/const videoData = \[([\s\S]*?)\];/);
        if (!videoDataMatch) {
            console.error('❌ data.js에서 videoData 배열을 찾을 수 없습니다.');
            return;
        }

        let existingVideoIds = new Set();
        const idMatches = videoDataMatch[1].matchAll(/videoId:\s?['"](.*?)['"]/g);
        for (const m of idMatches) existingVideoIds.add(m[1]);

        const videosToAdd = newVideos.filter(v => !existingVideoIds.has(v.videoId));

        if (videosToAdd.length === 0) {
            console.log('✨ 이미 최신 상태입니다. 추가할 새로운 영상이 없습니다.');
            return;
        }

        console.log(`🚀 ${videosToAdd.length}개의 새로운 영상을 추가합니다.`);

        // Format new entries
        const newEntriesStr = videosToAdd.map(v => {
            return `  { episode: ${v.episode}, lang: '${v.lang}', videoId: '${v.videoId}', title: '${v.title.replace(/'/g, "\\'")}', desc: '${v.desc.replace(/'/g, "\\'")}' }`;
        }).join(',\n');

        // Insert at the beginning of the array (after any language comments if we wanted to be fancy, 
        // but for simplicity we'll just add to the start of the list)
        const updatedVideoData = `const videoData = [\n${newEntriesStr},\n${videoDataMatch[1]}];`;
        const finalContent = dataContent.replace(/const videoData = \[[\s\S]*?\];/, updatedVideoData);

        fs.writeFileSync(DATA_FILE, finalContent, 'utf8');
        console.log('🎉 업데이트 완료! 이제 웹사이트에 새로운 영상이 표시됩니다.');

    } catch (err) {
        console.error('❌ 동기화 중 오류 발생:', err);
    }
}

sync();
