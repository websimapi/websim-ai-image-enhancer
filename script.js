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
                content: `You are an expert creative director specializing in visual concepts.
Your task is to take a user's simple image prompt and transform it into a much more detailed, unique, and artistically compelling prompt.
Combine the core concept with another unexpected but complementary theme or style.
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

