import confetti from "canvas-confetti";

const userPromptInput = document.getElementById('user-prompt');
const generateBtn = document.getElementById('generate-btn');
const loader = document.getElementById('loader');
const resultsDiv = document.getElementById('results');
const originalPromptText = document.getElementById('original-prompt-text');
const enhancedPromptText = document.getElementById('enhanced-prompt-text');
const resultImage = document.getElementById('result-image');

generateBtn.addEventListener('click', handleGeneration);
userPromptInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        handleGeneration();
    }
});

async function handleGeneration() {
    const originalPrompt = userPromptInput.value.trim();
    if (!originalPrompt) {
        alert('Please enter a prompt!');
        return;
    }

    // --- UI State: Loading ---
    generateBtn.disabled = true;
    loader.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    resultImage.src = "";

    try {
        // --- Step 1: Enhance the prompt ---
        const enhancedPrompt = await getEnhancedPrompt(originalPrompt);

        originalPromptText.textContent = originalPrompt;
        enhancedPromptText.textContent = enhancedPrompt;

        // --- Step 2: Generate the image with the enhanced prompt ---
        const imageResult = await websim.imageGen({
            prompt: enhancedPrompt,
            aspect_ratio: "1:1"
        });

        // --- UI State: Display Results ---
        resultImage.src = imageResult.url;
        resultImage.onload = () => {
            loader.classList.add('hidden');
            resultsDiv.classList.remove('hidden');
            generateBtn.disabled = false;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        };

    } catch (error) {
        console.error('An error occurred:', error);
        alert('Sorry, something went wrong. Please try again.');
        // --- UI State: Reset on Error ---
        loader.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

async function getEnhancedPrompt(prompt) {
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an expert creative director specializing in vivid, imaginative visual concepts.
Your task is to take a user's simple image prompt and transform it into a much more detailed, unique, and artistically compelling prompt.

To make your creation truly unique, you MUST combine the user's core concept with one or more concepts from the extensive lists provided below. The combination should be unexpected yet create a coherent and stunning visual. Be bold and creative.

**INSPIRATION LISTS:**

*   **Artistic Styles & Movements:**
    *   Steampunk, Cyberpunk, Biopunk, Dieselpunk, Solarpunk
    *   Art Deco, Art Nouveau, Bauhaus, Brutalism
    *   Surrealism, Impressionism, Cubism, Pointillism
    *   Ukiyo-e, Psychedelic Art, Vaporwave Aesthetic
    *   Gothic, Baroque, Rococo

*   **Materials & Textures:**
    *   Bioluminescent, Crystalline, Prismatic, Iridescent
    *   Polished Chrome, Rusted Iron, Verdigris Copper
    *   Ancient Mossy Stone, Volcanic Rock, Polished Marble
    *   Holographic Fabric, Woven Light, Liquid Metal
    *   Cracked Porcelain, Intricate Filigree, Lacquered Wood
    *   Translucent, Ethereal, Gossamer

*   **Mythical & Fantasy Creatures:**
    *   Dragon, Phoenix, Griffin, Kitsune, Chimera, Manticore
    *   Leviathan, Kraken, Hydra, Basilisk
    *   Dryad, Golem (made of stone, crystal, or clockwork), Elemental
    *   Angel, Demon, Djinn, Fae

*   **Sci-Fi & Cosmic Concepts:**
    *   Sentient Nebulae, Clockwork Planets, Dyson Spheres
    *   Alien Flora & Fauna, Extradimensional Beings
    *   Zero-Gravity Gardens, Post-Apocalyptic Libraries
    *   Cities on sleeping giants, Sunken metropolises, Floating islands
    *   Cosmic Horror, Eldritch Abominations

*   **Abstract & Moody Concepts:**
    *   Solitude, Serenity, Chaos, Harmony
    *   Nostalgia, Melancholy, Whimsical Dread, Joyful Defiance
    *   Dreams, Nightmares, Memories, Forgotten Realms

Focus on creating a visually rich description.
Respond ONLY with a JSON object following this schema: {"enhanced_prompt": "your new, creative prompt here"}.
Do not include any other text, greetings, or explanations.`,
            }, {
                role: "user",
                content: prompt,
            }, ],
            json: true,
        });

        const result = JSON.parse(completion.content);
        return result.enhanced_prompt;

    } catch (e) {
        console.error("Failed to enhance prompt:", e);
        // Fallback to the original prompt if enhancement fails
        return `A beautiful, high-quality image of: ${prompt}`;
    }
}