import sys
import io

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"c:\Users\sourav pc\Desktop\kalikapur\index.html"

with open(file_path, "r", encoding="utf-8", errors="surrogateescape", newline="") as f:
    content = f.read()

# We will normalize line endings to LF when checking to ensure match
target = """              const LIVE_PARTICIPANTS = participants.filter(p => String(p.eventId) === String(activeEventId));
              
              const PROMOTED = LIVE_PARTICIPANTS.filter(p => p.round !== 'audition');
              
              // Sort by score
              const LIVE_RESULTS = LIVE_PARTICIPANTS.map(p => {
                let total = 0;
                Object.values(p.scores || {}).forEach(jScores => {
                  Object.values(jScores).forEach(val => total += (Number(val) || 0));
                });
                return { name: p.name, score: total, catId: p.catId, round: p.round || 'audition', id: p.id };
              }).sort((a, b) => b.score - a.score);

              const mappedLiveResults = LIVE_RESULTS.map((p, idx) => ({
                rank: idx + 1,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                score: p.score,
                round: p.round || 'audition',
                id: p.id
              }));
              window.LIVE_RESULTS = mappedLiveResults;
              LIVE_RESULTS = mappedLiveResults;
              
              const mappedPromoted = PROMOTED.map(p => ({
                id: p.id,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                round: p.round
              }));
              window.PROMOTED = mappedPromoted;
              PROMOTED = mappedPromoted;"""

replacement = """              const LIVE_PARTICIPANTS = participants.filter(p => String(p.eventId) === String(activeEventId));
              
              const rawPromoted = LIVE_PARTICIPANTS.filter(p => p.round !== 'audition');
              
              // Sort by score
              const rawLiveResults = LIVE_PARTICIPANTS.map(p => {
                let total = 0;
                Object.values(p.scores || {}).forEach(jScores => {
                  Object.values(jScores).forEach(val => total += (Number(val) || 0));
                });
                return { name: p.name, score: total, catId: p.catId, round: p.round || 'audition', id: p.id };
              }).sort((a, b) => b.score - a.score);

              const mappedLiveResults = rawLiveResults.map((p, idx) => ({
                rank: idx + 1,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                score: p.score,
                round: p.round || 'audition',
                id: p.id
              }));
              window.LIVE_RESULTS = mappedLiveResults;
              LIVE_RESULTS = mappedLiveResults;
              
              const mappedPromoted = rawPromoted.map(p => ({
                id: p.id,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                round: p.round
              }));
              window.PROMOTED = mappedPromoted;
              PROMOTED = mappedPromoted;"""

# Let's perform replacement with normalized newlines
content_lf = content.replace("\r\n", "\n")
target_lf = target.replace("\r\n", "\n")
replacement_lf = replacement.replace("\r\n", "\n")

if target_lf in content_lf:
    content_lf = content_lf.replace(target_lf, replacement_lf)
    
    # Restore original line endings (which are LF for this file)
    with open(file_path, "w", encoding="utf-8", errors="surrogateescape", newline="") as f:
        f.write(content_lf)
    print("SUCCESS: Constant re-assignment fixed!")
else:
    print("FAILURE: Target code block not found!")
    # Let's print out what is actually in the file to debug
    pos = content_lf.find("const LIVE_PARTICIPANTS = participants.filter")
    if pos != -1:
        print("Actual context in file:")
        print(repr(content_lf[pos:pos+500]))
