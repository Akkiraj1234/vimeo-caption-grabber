// document.getElementById('runBtn').addEventListener('click', async () => {
//   document.getElementById('status').textContent = '⏳ Searching Vimeo player...';

//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
//   const playerFrame = frames.find(f => f.url.includes("player.vimeo.com"));

//   if (!playerFrame) {
//     document.getElementById('status').textContent = '❌ Vimeo player not found';
//     return;
//   }

//   chrome.scripting.executeScript({
//     target: { tabId: tab.id, frameIds: [playerFrame.frameId] },
//     func: () => {
//       const scripts = Array.from(document.scripts);
//       const configScript = scripts.find(s => s.textContent.includes('"text_tracks"'));
//       if (!configScript) return false;

//       const match = configScript.textContent.match(/{[^]*}/);
//       if (!match) return false;

//       let config;
//       try {
//         config = JSON.parse(match[0]);
//       } catch (e) {
//         return false;
//       }

//       const tracks = config.request?.text_tracks || config.text_tracks;
//       if (!Array.isArray(tracks)) return false;

//       (async () => {
//         for (let tt of tracks) {
//           const url = 'https://player.vimeo.com' + tt.url;
//           const label = tt.language || tt.label || tt.lang || tt.id;
//           try {
//             const res = await fetch(url);
//             if (!res.ok) throw new Error(`HTTP ${res.status}`);
//             const vtt = await res.text();

//             // Download .vtt
//             const blobVtt = new Blob([vtt], { type: 'text/vtt' });
//             const a = document.createElement('a');
//             a.href = URL.createObjectURL(blobVtt);
//             a.download = `${label}.vtt`;
//             a.click();

//             // Clean to plain .txt
//             const lines = vtt
//               .replace(/WEBVTT.*\n/, '')
//               .split('\n')
//               .filter(line => !/\d+:\d+:\d+\.\d+\s*-->/g.test(line) && !line.startsWith('NOTE') && !line.startsWith('STYLE'))
//               .map(line => line.replace(/<[^>]+>/g, '').trim())
//               .filter(Boolean);

//             const cleaned = lines.join('\n');

//             const txtBlob = new Blob([cleaned], { type: 'text/plain' });
//             const b = document.createElement('a');
//             b.href = URL.createObjectURL(txtBlob);
//             b.download = `${label}.txt`;
//             b.click();

//             // Now save the version that merges numbered lines
//             const merged = lines.filter(l => !/^\d+$/.test(l)).join('\n');
//             const blobMerged = new Blob([merged], { type: 'text/plain' });
//             const c = document.createElement('a');
//             c.href = URL.createObjectURL(blobMerged);
//             c.download = `${label}.cleaned.txt`;
//             c.click();

//           } catch (err) {
//             console.error('Transcript error:', err);
//             return false;
//           }
//         }
//       })();

//       return true;
//     },
//   }, (results) => {
//     if (chrome.runtime.lastError) {
//       document.getElementById('status').textContent = '❌ ' + chrome.runtime.lastError.message;
//     } else {
//       const success = results?.[0]?.result;
//       document.getElementById('status').textContent = success ? '✅ Done!' : '❌ Failed to extract transcript tracks.';
//     }
//   });
// });
// Load saved settings on startup
document.addEventListener('DOMContentLoaded', () => {
  const options = ['optionVTT', 'optionTXT', 'optionClean', 'darkModeToggle'];
  options.forEach(opt => {
    const el = document.getElementById(opt);
    const stored = localStorage.getItem(opt);
    if (el && stored !== null) {
      if (el.type === 'checkbox') el.checked = stored === 'true';
    }
  });

  if (document.getElementById('darkModeToggle').checked) {
    document.body.classList.add('darkmode');
  }
});

// Save settings on change
['optionVTT', 'optionTXT', 'optionClean', 'darkModeToggle'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('change', () => {
    localStorage.setItem(id, el.checked);
    if (id === 'darkModeToggle') {
      document.body.classList.toggle('darkmode', el.checked);
    }
  });
});

// Download transcript when button clicked
document.getElementById('runBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
  const playerFrame = frames.find(f => f.url.includes("player.vimeo.com"));
  const status = document.getElementById('status');
  status.textContent = '⏳ Looking for captions...';

  if (!playerFrame) {
    status.textContent = '❌ Vimeo player not found.';
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id, frameIds: [playerFrame.frameId] },
    func: async (wantVtt, wantTxt, wantClean) => {
      const scripts = Array.from(document.scripts);
      const configScript = scripts.find(s => s.textContent.includes('"text_tracks"'));
      if (!configScript) return false;

      const match = configScript.textContent.match(/{[^]*}/);
      if (!match) return false;

      let config;
      try { config = JSON.parse(match[0]); }
      catch (e) { return false; }

      const tracks = config.request?.text_tracks || config.text_tracks;
      if (!Array.isArray(tracks)) return false;

      for (let tt of tracks) {
        const url = 'https://player.vimeo.com' + tt.url;
        const label = tt.language || tt.label || tt.lang || tt.id;
        try {
          const res = await fetch(url);
          const vtt = await res.text();

          if (wantVtt) {
            const blob = new Blob([vtt], { type: 'text/vtt' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${label}.vtt`;
            a.click();
          }

          const lines = vtt
            .replace(/WEBVTT.*\n/, '')
            .split('\n')
            .filter(line => !/\d+:\d+:\d+\.\d+\s*-->/.test(line) && !line.startsWith('NOTE') && !line.startsWith('STYLE'))
            .map(line => line.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean);

          if (wantTxt) {
            const txtBlob = new Blob([lines.join('\n')], { type: 'text/plain' });
            const b = document.createElement('a');
            b.href = URL.createObjectURL(txtBlob);
            b.download = `${label}.txt`;
            b.click();
          }
          if (wantClean) {
            const cleanLines = lines.filter(line => !/^\d+$/.test(line));
            const cleanText = cleanLines.join('\n');
            const cleanBlob = new Blob([cleanText], { type: 'text/plain' });
            const c = document.createElement('a');
            c.href = URL.createObjectURL(cleanBlob);
            c.download = `${label}-clean.txt`;
            c.click();
          }

        } catch (_) {
          return false;
        }
      }
      return true;
    },
    args: [
      localStorage.getItem('optionVTT') === 'true',
      localStorage.getItem('optionTXT') === 'true',
      localStorage.getItem('optionClean') === 'true'
    ]
  }, (results) => {
    if (chrome.runtime.lastError) {
      status.textContent = '❌ ' + chrome.runtime.lastError.message;
    } else {
      const success = results?.[0]?.result;
      status.textContent = success ? '✅ Done!' : '❌ Failed to extract transcript tracks.';
    }
  });
});
