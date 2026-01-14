
# Emberlands | Emotional Memory Mapper

**Emberlands** is a private, contemplative web application that transforms your personal memories into a living, interactive 3D landscape. By leveraging artificial intelligence to analyze the emotional content of your journal entries, it generates a unique topography where peaks represent intense emotions and valleys represent moments of sorrow or reflection.

## 🌟 Key Features

*   **3D Emotional Landscape**: Visualizes your memory history as a procedurally generated 3D terrain using Three.js. The height and color of the terrain shift dynamically based on the intensity and type of emotions recorded.
*   **AI-Powered Analysis**: Uses **Google Gemini 1.5 Flash** to instantly analyze text and images, extracting:
    *   Dominant Emotions (Joy, Sorrow, Anger, Fear, Calm, Excitement, Anxiety, Awe)
    *   Emotional Intensity (1-10)
    *   Thematic Summaries
    *   Spatial Context (Location)
*   **Privacy-First Architecture**: Designed as a **local-first** application. All data is stored exclusively in your browser's `localStorage`. No personal data is sent to a central database.
*   **Secure Vault**: Protects your archive with a personal access key (passkey).
*   **Memory Threading**: Allows you to "thread" new memories onto existing ones, creating connected chains of thought or events.
*   **Pattern Recognition**: Periodically analyzes your history to generate reflective insights about emotional cycles and recurring patterns.
*   **Multi-Modal Input**: Supports text, image uploads, voice-to-text recording, and optional geolocation tagging.
*   **Data Portability**: Full export (JSON) and import functionality to backup or migrate your emotional landscape.

## 🛠️ Tech Stack

*   **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **3D Engine**: [Three.js](https://threejs.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **AI Integration**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (Gemini 1.5 Flash)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository** (or download source files):
    ```bash
    git clone <repository-url>
    cd emotional-memory-mapper
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and add your Google Gemini API Key:
    ```env
    API_KEY=your_actual_api_key_here
    ```

4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:3000`.

## 📖 Usage Guide

1.  **Initialization**: On first load, create a secure Access Key. This acts as the password for your local vault.
2.  **Mapping a Memory**:
    *   Type your thought in the input area.
    *   Optionally upload an image or use the microphone for voice input.
    *   Toggle the "Location" pin if you want to store GPS coordinates.
    *   Click "Map Memory".
3.  **Exploring**:
    *   **Terrain Tab**: Drag to rotate and scroll to zoom the 3D map. Click on glowing orbs (landmarks) to view details.
    *   **Library Tab**: View the definitions and metaphors for the emotional palette used by the system.
4.  **Vault Control**: Access the menu in the top right to Export, Import, or Dissolve (delete) your data.

## 🔒 Privacy Note

This application treats privacy as a priority.
*   **Data Storage**: All emotional data remains on your device (in LocalStorage).
*   **AI Processing**: Data is sent to the Google Gemini API solely for analysis and is not stored by the application backend (as there is no custom backend).
*   **Security**: The "Lock" feature prevents casual access on a shared device, but remember that data is stored in the browser; clearing browser cache/data will wipe your vault unless you have exported a backup.

## 📄 License

This project is open-source. Feel free to modify and adapt it for your personal use.
