import confetti from "canvas-confetti";

const userPromptInput = document.getElementById('user-prompt');
const generateBtn = document.getElementById('generate-btn');
const loader = document.getElementById('loader');
const resultsDiv = document.getElementById('results');
const originalPromptText = document.getElementById('original-prompt-text');
const addedConceptContainer = document.querySelector('.concept-display');
const addedConceptText = document.getElementById('added-concept-text');
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
    addedConceptContainer.classList.add('hidden');
    resultImage.src = "";

    try {
        // --- Step 1: Enhance the prompt ---
        const enhancementResult = await getEnhancedPromptAndConcept(originalPrompt);
        
        const { concept, enhancedPrompt } = enhancementResult;

        originalPromptText.textContent = originalPrompt;
        enhancedPromptText.textContent = enhancedPrompt;
        
        if (concept) {
            addedConceptText.textContent = concept;
            addedConceptContainer.classList.remove('hidden');
        }

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

async function getEnhancedPromptAndConcept(prompt) {
    try {
        // --- AI Call 1: Get a creative concept to merge ---
        const conceptCompletion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are a creative muse. A user will provide a core idea for an image. Your task is to suggest a single, unique, and visually interesting concept to merge with the user's idea.
                The concept should be a specific noun or noun phrase from any domain imaginable. Think of things like:
                - An object (e.g., "antique pocket watch", "sentient teapot")
                - An animal (e.g., "axolotl", "leviathan made of starlight")
                - A place (e.g., "sunken library", "city in a bottle")
                - An artistic style (e.g., "Art Deco", "Glitch Art")
                - A material or texture (e.g., "made of woven light", "carved from a soap bubble")
                - An abstract idea (e.g., "a fleeting memory", "the sound of the color blue")
                - A completely random concept (e.g., "sushi", "a jazz solo", "quantum foam")
                
                Your goal is to be wildly creative, random, and unexpected. The combination should be surprising.
                Avoid clichés and predictable pairings. Think outside the box.
                Respond ONLY with a JSON object following this schema: {"concept": "Your chosen concept"}.
                Do not include any other text, greetings, or explanations.`,
            }, {
                role: "user",
                content: prompt,
            }, ],
            json: true,
        });

        const conceptResult = JSON.parse(conceptCompletion.content);
        const creativeConcept = conceptResult.concept;

        // --- AI Call 2: Create the final detailed prompt ---
        const promptCompletion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an expert creative director specializing in vivid, imaginative visual concepts.
                Your task is to take a user's original idea and a specific "creative concept" and combine them into a single, detailed, and artistically compelling prompt for an image generator.
                Elaborate on the combination, describing the scene, lighting, mood, and composition in a visually rich way.
                Focus on creating a description that would result in a stunning and unique image.
                Respond ONLY with a JSON object following this schema: {"enhanced_prompt": "your new, creative prompt here"}.
                Do not include any other text, greetings, or explanations.`,
            }, {
                role: "user",
                content: `Original Idea: "${prompt}"\nCreative Concept to incorporate: "${creativeConcept}"`,
            }, ],
            json: true,
        });

        const promptResult = JSON.parse(promptCompletion.content);

        return {
            concept: creativeConcept,
            enhancedPrompt: promptResult.enhanced_prompt,
        };

    } catch (e) {
        console.error("Failed to enhance prompt:", e);
        // Fallback to a simpler enhancement if the multi-step process fails
        return {
            concept: null,
            enhancedPrompt: `A beautiful, high-quality, fantasy art style image of: ${prompt}`,
        };
    }
}