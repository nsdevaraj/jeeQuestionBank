# JEE Question Bank

An interactive web application for JEE (Joint Entrance Examination) preparation, featuring a comprehensive question bank with mathematical formula support.

## Features

- 📚 Subject-wise question filtering
- ⚡ Interactive quiz interface
- 📐 Mathematical formula rendering using KaTeX
- 📊 Structured table display for data presentation
- 📑 PDF export functionality
- 🎯 Progress tracking
- 📱 Responsive design for all devices

## Tech Stack

- React + TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- KaTeX (Math formula rendering)
- jsPDF & html2canvas (PDF export)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nsdevaraj/jeeQuestionBank.git
cd jeeQuestionBank
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build for Production

To create a production build:

```bash
npm run build
```

The built files will be available in the `dist` directory.

## Project Structure

```
jeeQuestionBank/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── data/            # Question bank data
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── ...config files      # Various configuration files
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For any queries or suggestions, please open an issue on GitHub.
