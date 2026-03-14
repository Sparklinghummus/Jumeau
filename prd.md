# PRD: jumeau Chrome Extension

**Concept:** A voice-driven, multimodal "sidekick" that builds portable AI logic (Skills/Gems/Agents) by watching your screen and listening to your intent.

## 1. Product Architecture (The "Extension" Layer)
Unlike a standalone app, the extension uses Chrome's native capabilities to provide a seamless "ambient" experience.
* **The Sidepanel UI:** A persistent but collapsible panel (using the sidePanel API) that hosts the Live Canvas. This is where the workflow "bubbles" appear as the user speaks.
* **Overlay Highlights:** A transparent "ink" layer over the active webpage that highlights elements the AI is discussing (e.g., a green glow around a table it's about to scrape).
* **Audio Capture:** Uses the tabCapture and offscreen APIs to maintain a full-duplex voice loop without needing a separate tab open.

## 2. Core Feature: Multimodal Interactivity

### 2.1. "Look and Speak" Contextualization
The extension uses the Vision LLM to analyze the active tab's viewport.
* **User Action:** User looks at a Salesforce record and says, "Move this contact to my 'VIP' list in Notion."
* **AI Action:** The extension identifies the "Contact Name" and "Email" fields on the page visually.
* **Vocal Follow-up:** "I see John Doe's profile. Should I include his phone number in the Notion sync as well?"

### 2.2. Interactive Live Canvas (The Blueprint)
The sidepanel doesn't just show a list; it shows a dynamic map:
* **Node Creation:** When the user says "Then summarize it," a bubble appears.
* **Tactile Editing:** If the AI gets it wrong, a non-technical user can simply swipe a bubble away or say "Actually, delete that last step."
* **Status Indicators:** Nodes pulse or change color to show "Thinking," "Missing Info," or "Ready to Export."

## 3. The Knowledge Repo (Personal Memory)
The extension acts as a local brain that remembers how the user works across different websites.
* **Domain Awareness:** It remembers that on github.com, "the issue" refers to the specific ticket on screen.
* **Skill Memory:** If the user previously built a "Summary Skill" for Gmail, the extension will suggest it when the user opens an Outlook tab: "Want to use your Gmail Summary Skill here?"

## 4. The "Translator" (Universal Export)
This is the final step for the non-technical user. Once the conversation is over, the "Blueprint" is ready.

| Target AI | User Interaction | Extension Backend Action |
| :--- | :--- | :--- |
| Claude | Click "Add to Claude" | Generates a SKILL.md file and triggers a file-upload dialog in the Claude tab. |
| Gemini | Click "Create Gem" | Copies the logic into the Gemini "System Instructions" text area via DOM injection. |
| Copilot | Click "Add to Copilot" | Formats the logic into a "Custom Instruction" block for Microsoft 365. |

## 5. Technical Requirements for Chrome
* **Permissions:** activeTab, sidePanel, storage, desktopCapture (for screen vision), and scripting (to highlight elements).
* **Multimodal Backbone:**
    * **Transcription:** Whisper API or Gemini Nano (on-device for speed).
    * **Vision/Logic:** Claude 3.5 Sonnet Vision (via API) to parse the screenshot and user intent.
    * **Speech:** ElevenLabs for the "Interrogator" voice.

## 6. Non-Technical User Flow: "The Morning Routine"
* **Voice Trigger:** User clicks the "Echo" icon in their Chrome bar.
* **The Interaction:**
    * **User:** "I need to take these 10 news articles and turn them into a LinkedIn post in my voice."
    * **Extension:** Highlights the article list. "Got it. I see the 10 headlines. Should I use your 'Snarky Tech' persona or your 'Professional' one?"
    * **User:** "Snarky Tech."
* **The Visual Build:** The sidepanel draws: `[Screen: News List] → [Skill: Snarky Persona] → [Output: LinkedIn Post]`.
* **Finalize:** The AI says: "All set. I've built the logic. Should I send this to Claude so you can see the draft?"
* **One-Click:** User clicks "Go," and the extension handles the rest.