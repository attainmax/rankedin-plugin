// The eval suite, as data. `node scripts/generate-evals.mjs` writes evals/ from it.
//
// expect:   'profile-review' | 'next-career-move' | 'either' (either rankedin skill is
//           acceptable) | 'none' (rankedin should stay quiet) | 'soft' (no activation
//           expectation — reported, never scored)
// state:    'analyzed' (the suite-wide mocks: a user with one analysis) | 'fresh' (no analysis)
// tools:    rankedin tools that MUST be called
// notTools: rankedin tools that must NOT be called
// rubric:   extra PASS/FAIL criteria for the judge (quality + truthfulness)

const CONTEXT_USER = 'Background: I am a content marketing manager at a B2B software company, about eight years into my career.'

export const CASES = [
  // ── Discovery: LinkedIn / profile ──────────────────────────────────────────
  { group: 'discovery', name: 'li-analyze-my-linkedin', prompt: 'Analyze my LinkedIn.', expect: 'profile-review', tools: ['get_my_scores'] },
  { group: 'discovery', name: 'li-improve-profile', prompt: 'How can I improve my LinkedIn profile?', expect: 'profile-review', tools: ['get_improvement_tips'] },
  { group: 'discovery', name: 'li-is-profile-strong', prompt: 'Is my profile strong?', expect: 'profile-review', tools: ['get_my_scores'] },
  { group: 'discovery', name: 'li-what-profile-says', prompt: 'What does my profile say about me?', expect: 'profile-review' },
  { group: 'discovery', name: 'li-improve-professionally', prompt: 'What should I improve professionally?', expect: 'profile-review', tools: ['get_improvement_tips'] },

  // ── Discovery: resume ──────────────────────────────────────────────────────
  { group: 'discovery', name: 'resume-emphasize', prompt: 'What should I emphasize on my resume?', expect: 'profile-review', tools: ['get_improvement_tips'],
    rubric: 'PASS if the reply bases resume emphasis on strengths returned by the rankedin tools (for example credibility, career progression, editorial strategy) and attributes them to the rankedin analysis. FAIL if it presents generic resume advice as the user\'s own analysis.' },
  { group: 'discovery', name: 'resume-strongest-qualities', prompt: 'What are my strongest qualities for my resume?', expect: 'profile-review' },
  { group: 'discovery', name: 'resume-positioning-first', prompt: 'Help me understand my positioning before I rewrite my resume.', expect: 'profile-review' },
  { group: 'negative', name: 'resume-rewrite-bullet', prompt: 'Rewrite this resume bullet to sound stronger: "Responsible for managing a team of 5 engineers and delivering projects."', expect: 'none' },

  // ── Discovery: job search ──────────────────────────────────────────────────
  { group: 'discovery', name: 'job-need-a-job', prompt: 'I need a job.', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'job-search-not-working', prompt: `My job search isn't working. ${CONTEXT_USER}`, expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'job-where-to-start', prompt: "I'm looking for a new job. Where should I start?", expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'job-which-roles', prompt: 'What kind of roles should I consider?', expect: 'next-career-move' },
  { group: 'discovery', name: 'job-search-strategy', prompt: 'Help me figure out my job-search strategy.', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'negative', name: 'job-find-openings', prompt: 'Find current job openings for product managers in Austin.', expect: 'none',
    rubric: 'FAIL if the reply claims rankedin can find, list or search job openings.' },

  // ── Discovery: career ──────────────────────────────────────────────────────
  { group: 'discovery', name: 'career-dont-know-next', prompt: "I don't know what to do next in my career.", expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'career-stuck', prompt: 'I feel stuck in my career.', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'career-change', prompt: 'Should I change careers?', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'career-stay-in-field', prompt: 'Should I stay in my field?', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'career-next-move', prompt: 'What should my next move be?', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'career-directions', prompt: 'What career directions should I consider?', expect: 'next-career-move' },

  // ── Discovery: AI ──────────────────────────────────────────────────────────
  { group: 'discovery', name: 'ai-affect-career', prompt: 'Is AI going to affect my career?', expect: 'either' },
  { group: 'discovery', name: 'ai-ready', prompt: 'Am I ready for AI?', expect: 'profile-review', tools: ['get_my_scores'] },
  { group: 'discovery', name: 'ai-changing-my-job', prompt: 'AI is changing my job. What should I do?', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'ai-which-strengths', prompt: 'Which of my strengths will matter as AI changes my field?', expect: 'either', tools: ['get_improvement_tips'] },

  // ── Discovery: reputation / network ────────────────────────────────────────
  { group: 'discovery', name: 'rep-build-reputation', prompt: 'How do I build my professional reputation?', expect: 'next-career-move', tools: ['get_career_paths'] },
  { group: 'discovery', name: 'rep-more-visible', prompt: 'I need to become more visible professionally.', expect: 'next-career-move' },
  { group: 'discovery', name: 'net-is-network-strong', prompt: 'Is my network strong?', expect: 'profile-review', tools: ['get_network_summary'], notTools: ['get_peer_comparison'] },
  { group: 'discovery', name: 'net-right-people', prompt: 'Am I connected to the right kinds of people?', expect: 'profile-review',
    rubric: 'FAIL if the reply states which industries, companies, seniority levels or kinds of people the user\'s network contains — rankedin returns no network composition. PASS if it says that composition is not something rankedin provides and uses only the figures the tools returned.' },
  { group: 'discovery', name: 'rep-more-customers', prompt: 'How can I get more customers from my professional presence? I run a small design studio.', expect: 'next-career-move', tools: ['get_career_paths'] },

  // ── Ambiguous: assess vs decide ────────────────────────────────────────────
  { group: 'routing', name: 'amb-where-do-i-stand', prompt: 'Where do I stand?', expect: 'profile-review' },
  { group: 'routing', name: 'amb-what-to-improve', prompt: 'What should I improve?', expect: 'profile-review' },
  { group: 'routing', name: 'amb-what-to-do-next', prompt: 'What should I do next?', expect: 'next-career-move' },
  { group: 'routing', name: 'amb-how-am-i-doing', prompt: 'How am I doing?', expect: 'profile-review' },
  { group: 'routing', name: 'amb-analyze-me', prompt: 'Analyze me.', expect: 'profile-review' },
  { group: 'routing', name: 'amb-worried-about-ai', prompt: "I'm worried about AI.", expect: 'either' },
  { group: 'routing', name: 'amb-need-a-change', prompt: 'I need a change.', expect: 'next-career-move' },
  { group: 'routing', name: 'amb-career-stalled', prompt: 'My career has stalled.', expect: 'next-career-move' },
  { group: 'routing', name: 'amb-become-visible', prompt: 'I want to become more visible.', expect: 'next-career-move' },

  // ── False-positive checks: rankedin should stay quiet ──────────────────────
  { group: 'negative', name: 'neg-cover-letter', prompt: "What's a good way to structure a cover letter?", expect: 'none' },
  { group: 'negative', name: 'neg-salary-negotiation', prompt: 'How do I negotiate a higher salary offer?', expect: 'none' },
  { group: 'negative', name: 'neg-interview-questions', prompt: 'Give me common interview questions for a data analyst role.', expect: 'none' },
  { group: 'negative', name: 'neg-write-launch-post', prompt: 'Write a LinkedIn post announcing our product launch next Tuesday.', expect: 'none' },
  { group: 'negative', name: 'neg-typical-salary', prompt: 'What does a product manager typically earn in London?', expect: 'none' },
  { group: 'negative', name: 'neg-linkedin-premium', prompt: 'What does LinkedIn Premium include?', expect: 'none' },
  { group: 'negative', name: 'neg-python-bug', prompt: 'Why does my Python list comprehension return None values?', expect: 'none' },
  { group: 'negative', name: 'neg-headline-tips', prompt: 'How do I write a good LinkedIn headline?', expect: 'soft' },

  // ── No analysis: both skills, no fabrication, still useful ─────────────────
  { group: 'no-analysis', name: 'na-profile-scores', state: 'fresh', prompt: 'Analyze my LinkedIn profile and tell me my scores.', expect: 'profile-review', tools: ['get_my_scores'],
    rubric: 'PASS if the reply says there is no rankedin analysis yet, gives the upload link rankedin.app/dashboard/upload, explains what an analysis would provide, and offers something useful now (such as help deciding what to focus on next). FAIL if it states or estimates any score, rating, percentile or grade for the user, or implies an analysis exists.' },
  { group: 'no-analysis', name: 'na-peer-compare', state: 'fresh', prompt: 'How do I compare with my peers?', expect: 'profile-review',
    rubric: 'FAIL if the reply gives any percentile, ranking, or comparison of the user against peers. PASS if it explains that a comparison needs their rankedin analysis and how to get one.' },
  { group: 'no-analysis', name: 'na-ai-resilience', state: 'fresh', prompt: 'How AI resilient am I?', expect: 'profile-review',
    rubric: 'FAIL if the reply gives the user an AI resilience score, risk level or rating. PASS if it explains that this needs their rankedin analysis, and may add clearly labelled general guidance.' },
  { group: 'no-analysis', name: 'na-next-move-marketing', state: 'fresh', prompt: "What should my next career move be? I'm a marketing manager at a SaaS company, eight years in, and I'm bored.", expect: 'next-career-move', tools: ['get_career_paths'],
    rubric: 'PASS if the reply recommends a concrete direction and first step using the rankedin career paths returned by the tool, relates it to what the user said, and offers the rankedin analysis as a way to personalise further. FAIL if it contains any score or percentile for the user, claims an analysis exists, or gives no concrete direction at all.' },
  { group: 'no-analysis', name: 'na-ai-copywriter', state: 'fresh', prompt: 'AI is changing my job as a copywriter. What should I do?', expect: 'next-career-move', tools: ['get_career_paths'],
    rubric: 'PASS if the reply gives concrete direction for the user now, without an upload. FAIL if it states an AI resilience score or risk level for the user, or implies one was measured.' },
  { group: 'no-analysis', name: 'na-freelancer-clients', state: 'fresh', prompt: "I'm a freelance designer and I need more clients.", expect: 'next-career-move', tools: ['get_career_paths'],
    rubric: 'PASS if the reply points to the attract-more-customers / business development path and gives a first step. FAIL if it contains any score for the user.' },
  { group: 'no-analysis', name: 'na-need-job-start', state: 'fresh', prompt: 'I need a job. Where should I start?', expect: 'next-career-move', tools: ['get_career_paths'],
    rubric: 'PASS if the reply gives at least a provisional direction and a first step, even if it also asks a few questions. FAIL if it only asks questions, or only tells the user to upload their data.' },
  { group: 'no-analysis', name: 'na-teacher-to-ux', state: 'fresh', prompt: "Should I change careers? I'm a teacher thinking about moving into UX design.", expect: 'next-career-move', tools: ['get_career_paths'],
    rubric: 'PASS if the reply engages with the teacher-to-UX move using the career pivot path and gives a first step. FAIL if it claims to have assessed the user\'s profile or gives them any score.' },

  // ── Analysis present: deeper answers, real figures only ────────────────────
  { group: 'with-analysis', name: 'wa-full-review', prompt: 'Analyze my LinkedIn profile.', expect: 'profile-review', tools: ['get_my_scores', 'get_peer_comparison', 'get_improvement_tips'],
    rubric: 'PASS if the reply reports the overall score 64/100 and AI resilience 41/100 (high risk), names real strengths and gaps from the tool results, includes the global percentile 68th, states the analysis date (12 September 2026 or 2026-09-12), and ends with prioritised improvements. FAIL if it states any figure that is not in the tool results, or claims a peer-group percentile (the tool said there were not enough peers).' },
  { group: 'with-analysis', name: 'wa-network-only', prompt: 'How strong is my professional network?', expect: 'profile-review', tools: ['get_network_summary'], notTools: ['get_peer_comparison', 'get_career_timeline'],
    rubric: 'PASS if the reply uses the network figures (for example 1284 connections) and states the analysis date. FAIL if it describes industries, companies or kinds of people in the network.' },
  { group: 'with-analysis', name: 'wa-next-move', prompt: 'What should my next career move be?', expect: 'next-career-move', tools: ['get_career_paths'],
    rubric: 'PASS if the reply uses the recommendation from the rankedin analysis (job search and/or career pivot), attributes it to the analysis, and gives a concrete first step. FAIL if it presents reasoning as rankedin findings without attribution, or invents figures.' },
  { group: 'with-analysis', name: 'wa-ai-changing-job', prompt: 'AI is changing my job. What should I do?', expect: 'next-career-move', tools: ['get_career_paths'],
    rubric: 'PASS if the reply cites the AI resilience score 41/100 or high risk from the analysis, uses AI-resistant skills or pivot directions returned by the tools, and gives a concrete next step. FAIL if it states an AI resilience percentile or any figure not in the tool results.' },
  { group: 'with-analysis', name: 'wa-resume-emphasis', prompt: 'What should I emphasize on my resume?', expect: 'profile-review', tools: ['get_improvement_tips'],
    rubric: 'PASS if the emphasis is grounded in strengths from the tool results and attributed to the analysis. FAIL if it claims rankedin wrote or rewrote the resume.' },
  { group: 'with-analysis', name: 'wa-who-changed-jobs', prompt: 'Who in my network changed jobs recently?', expect: 'profile-review',
    rubric: 'PASS if the reply says rankedin cannot name or identify individual connections or who changed jobs. FAIL if it names any person, or describes anyone as having changed jobs, left, or quit.' },
  { group: 'with-analysis', name: 'wa-score-change', prompt: 'How much has my profile score improved since my last analysis?', expect: 'profile-review',
    rubric: 'PASS if the reply says rankedin does not provide score changes between analyses (and may report the current score). FAIL if it states or estimates any change, improvement or previous score.' },
  { group: 'with-analysis', name: 'wa-promotion-ready', prompt: 'Am I ready for a promotion?', expect: 'soft',
    rubric: 'FAIL if the reply says rankedin has assessed or determined promotion readiness, or presents a readiness verdict as rankedin output. PASS if any view on promotion is clearly the assistant\'s own reasoning, with any rankedin figures attributed to the analysis.' },
]
