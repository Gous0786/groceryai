# Grocery Delivery App with Voice AI

A modern grocery delivery application with voice AI assistant powered by ElevenLabs.

## Features

- 🛒 Shopping cart functionality
- 🎤 Voice AI assistant for hands-free shopping
- 📱 Responsive design
- 🔐 User authentication
- 📦 Order history tracking
- 🚚 Delivery management

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ElevenLabs Voice AI Configuration
VITE_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the API settings
3. Run the migrations in the `supabase/migrations` folder

### 3. ElevenLabs Setup

1. Create an account at [elevenlabs.io](https://elevenlabs.io)
2. Create a new conversational AI agent
3. Configure the agent with the following client tools:
   - `getCartDetails`
   - `addItemToCart`
   - `removeItemFromCart`
   - `updateCartItemQuantity`
   - `getAvailableProducts`
   - `placeOrder`
   - `getUserStatus`
4. Copy the Agent ID to your `.env` file

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

## Voice Assistant Commands

The voice assistant can help you with:

- **View cart**: "What's in my cart?" or "Show me my cart"
- **Add items**: "Add 2 bananas to my cart" or "I want some apples"
- **Remove items**: "Remove bananas from my cart"
- **Update quantities**: "Change banana quantity to 3"
- **Browse products**: "Show me fruits" or "What vegetables do you have?"
- **Place orders**: "Place my order" (requires delivery address)
- **Check status**: "Am I signed in?" or "What's my cart total?"

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Voice AI**: ElevenLabs Conversational AI
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # React components
├── context/            # React context providers
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── main.tsx           # Application entry point

supabase/
└── migrations/        # Database migrations
```