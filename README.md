# Enrico C. Orallo – Portfolio

A fishing-themed portfolio. Pick a fish and the rod reels in the section you want to read.

## Run it in VS Code
1. Install **VS Code**, then open this folder (`File > Open Folder…`).
2. Install the **Live Server** extension (VS Code will suggest it).
3. Right-click `index.html` and choose **Open with Live Server**. It opens at `http://127.0.0.1:5500`.
   (You can also just double-click `index.html`; everything works without a server.)

## Files
- `index.html`: all the content. Edit the text for each section here.
- `css/styles.css`: colors (the variables at the top), the lake scene, and the layout.
- `js/config.js`: your email, LinkedIn, GitHub, and the feedback endpoint.
- `js/app.js`: the fishing animation, theme toggle, deep links, and feedback form.
- `assets/profile.jpg`: the profile photo used in the hero.

## Try these
- Click a fish, then use the browser Back button. Links like `index.html#projects` open that section directly.
- Press the moon/sun button to switch themes (it remembers your choice).
- Use the arrow keys to move between fish, and Enter to catch one.
- Submit the feedback form, then open `index.html?admin` to see what was saved in your browser.

## Receive feedback from real visitors
Saved feedback stays in the visitor's own browser unless you connect an endpoint:
1. Create a free form at https://formspree.io and copy its URL.
2. Paste it into `feedbackEndpoint` in `js/config.js`.
Without an endpoint, visitors get a button that opens a pre-filled email to you.

## Publish it
Upload the folder to GitHub Pages, Netlify, or Vercel. No build step is needed.
