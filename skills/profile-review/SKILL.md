---
name: profile-review
description: Assess the user's own professional profile with rankedin. Use when they ask to analyze or review their LinkedIn profile, how strong their profile is, what their strengths or biggest gaps are, how they compare with peers or people like them, how AI resilient they are, how strong their professional network is, what to improve first, whether their professional positioning is strong or ready for a job search, or which of their real strengths their resume should emphasize. Personal results come only from the user's own rankedin analysis of their LinkedIn data export. If they have no analysis yet, explain what is missing and offer help deciding what to do next, which needs no upload.
license: MIT
---

# Profile review — "tell me about me"

rankedin analyzes the user's own LinkedIn data export and stores the result as an analysis in their rankedin account. This skill turns that stored analysis into a clear assessment. It never produces an assessment any other way.

The tools below belong to the rankedin connector. Call them by these names.

## Pick the tools the question needs

A narrow question gets a narrow answer. Call only what the question needs:

| The user asks about | Call |
|---|---|
| Profile strength, scores, AI resilience score | `get_my_scores` |
| How they compare with peers or people like them | `get_peer_comparison` |
| Strengths, gaps, what to improve, resume emphasis | `get_improvement_tips` |
| How strong their network is, network size, growth, engagement | `get_network_summary` |
| How their connections changed between two exports | `get_connection_insights` |
| A broad review ("analyze my profile", "how am I doing?") | `get_my_scores`, then `get_peer_comparison`, then `get_improvement_tips` |

Add `get_network_summary` to a broad review only when the user mentions their network.

## Shape of a broad review

Keep it short and in this order:

1. **Where you stand:** the overall score and the AI resilience score, with the analysis date.
2. **Strongest areas:** two or three, from the tool output.
3. **Most important gaps:** two or three, from the tool output.
4. **Peer context:** percentiles only when `get_peer_comparison` returned them.
5. **What to do first:** the top two or three improvements, from `get_improvement_tips`.

End with one line offering to help decide what to focus on next. That is the `next-career-move` skill.

## Resume and positioning questions

rankedin does not write resumes. When the user wants to know what their resume should emphasize, use their real strengths and gaps from `get_improvement_tips` (and scores if relevant) as the input, and say that is what you are using. If they then ask you to write or rewrite resume text, you can help, but make clear the wording is yours, not rankedin output.

## When a tool has nothing to return

- **No analysis yet** (the tool says to upload a LinkedIn export): do not estimate anything. Say that a personal assessment needs their own analysis, and explain what the export enables: profile scores, strengths and gaps, peer comparison, AI resilience and network insight. Pass on the upload link exactly as the tool gave it. Then offer something useful right now: help deciding what to focus on next, which works without an upload (the `next-career-move` skill). General profile advice is fine too, labelled as general advice, not as their assessment.
- **Data missing for one tool** (for example too few peers to compare): say that part is unavailable and continue with what the other tools returned.
- **Stale analysis** (the tool flags it): still use it, state its date, and suggest a fresh upload only if the question is about their situation today.

## What rankedin cannot answer

Say so plainly if asked. Do not substitute another tool's output.

- Changes in scores between analyses (not provided)
- A percentile for the AI resilience score (not provided)
- Which industries or companies their network reaches (not provided)
- Who joined, left, or changed jobs in their network (connection data is counts only)
- Whether they are ready for a promotion (rankedin does not assess this)

<!-- BEGIN shared-truthfulness (keep identical in every rankedin skill; CI checks this) -->
## Truthfulness rules

These apply to every answer that uses rankedin.

1. **Every rankedin fact comes from a rankedin tool result in this conversation.** That includes scores, percentiles, AI resilience, network figures, peer comparisons, recommendations, career directions, and changes over time. If no tool returned it, do not state it.
2. **Never estimate, infer or approximate a rankedin result.** An unanalyzed profile has no score. A plausible guess is worse than none.
3. **Never imply an analysis exists when it does not**, and never present general guidance as if it came from an analysis.
4. **Keep two voices visibly separate.** Findings from the user's rankedin analysis are attributed to it, with its date ("Your rankedin analysis from 12 September shows…"). Anything else is reasoning from what the user told you and from rankedin's career-path framework, and reads that way ("Based on what you've told me…"). Use natural wording; the distinction matters more than the phrase.
5. **Connection data is aggregate.** It never names people. A record absent from a newer export is absent, not "left" or "quit". A different recorded title or company is a text difference, not a confirmed job change.
6. **Do not claim capabilities rankedin does not have.** rankedin does not write resumes, list job openings, coach interviews, negotiate salary, assess promotion readiness, or take actions on the user's behalf. Guided step-by-step plans exist only on rankedin.app, after an analysis. Do not say one has been created or started.
7. **Pass links on exactly as a tool gave them.** Do not invent rankedin URLs.
<!-- END shared-truthfulness -->
