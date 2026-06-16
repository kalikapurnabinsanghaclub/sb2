const j = { id: 3, name: 'judge1', email: 'j@knsdc.in', eventId: '1781271255289', present: true };
const activeEventId = "1781271255289";
const subjects = [
  {
    id: 1781624588845,
    name: "Creativity",
    maxMarks: 10,
    desc: "Originality of movement...",
    eventId: 1781271255289
  }
];
const onStage = {
  scores: {
    "3": {
      "1781624588845": 5
    }
  }
};
const sState = {
  judgeAgreements: [
    {
      id: "405168598",
      name: "judge1",
      email: "j@knsdc.in"
    }
  ]
};

const agr = (sState.judgeAgreements || []).find(a => 
  (a.email && j.email && String(a.email).toLowerCase() === String(j.email).toLowerCase()) || 
  (a.name && j.name && String(a.name).toLowerCase() === String(j.name).toLowerCase())
);
const jScores = onStage.scores?.[j.id] || (agr && onStage.scores?.[agr.id]) || {};
let scoredCount = 0;
let judgeTotal = 0;
subjects.forEach(s => {
  console.log("Checking subject id:", s.id, "against jScores:", jScores);
  if (jScores[s.id] !== undefined && jScores[s.id] !== null) {
    scoredCount++;
    judgeTotal += Number(jScores[s.id]) || 0;
  }
});
console.log("scoredCount:", scoredCount);
console.log("subjects.length:", subjects.length);
console.log("judgeTotal:", judgeTotal);
