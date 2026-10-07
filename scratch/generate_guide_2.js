const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Ken Merrell Complete Platform Guide",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "Welcome to your complete platform guide. This document explains every feature on the live website, where your visitors see it, and exactly how you can edit and manage it from your custom Content Management System (CRM).",
            }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Accessing the CRM",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "To make any changes to your website, you must log in to your CRM dashboard:" }),
            new Paragraph({ text: "1. Go to your live website." }),
            new Paragraph({ text: "2. Add /admin to the end of the URL (e.g., www.kenmerrell.com/admin)." }),
            new Paragraph({ text: "3. Log in with your secure credentials." }),
            new Paragraph({ text: "Once logged in, any changes you save will instantly update the live website. (If you don't see changes immediately on the live site, perform a Hard Refresh: Ctrl+F5 on Windows, or Cmd+Shift+R on Mac)." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF LOGIN PAGE HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Feature 1: The Homepage Banner & Praise Quotes",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Where it is on the website:", bold: true }),
            new Paragraph({ text: "Right at the very top of the homepage, below the main title. This is a dynamic carousel of quotes that swipe back and forth to immediately capture the visitor's attention." }),
            new Paragraph({ text: "How to edit and change it in the CRM:", bold: true }),
            new Paragraph({ text: "• In the CRM, click on the 'About' tab on the left sidebar." }),
            new Paragraph({ text: "• Scroll down to the 'Homepage quotes' section." }),
            new Paragraph({ text: "• Here you can edit the text, the subtext, and the author of each quote." }),
            new Paragraph({ text: "• You can add new quotes by clicking 'Add a quote', or remove them. (3 to 4 quotes work best)." }),
            new Paragraph({ text: "• Click 'Save Changes' at the top to publish." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF HOMEPAGE QUOTES CRM EDITING HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Feature 2: The Author Biography & Photo",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Where it is on the website:", bold: true }),
            new Paragraph({ text: "When visitors click 'About' in the navigation menu, they are taken to the About section which features your professional headshot, a highlighted 'pull quote', and your full biography." }),
            new Paragraph({ text: "How to edit and change it in the CRM:", bold: true }),
            new Paragraph({ text: "• In the CRM, click on the 'About' tab." }),
            new Paragraph({ text: "• Under 'Author photo', you can upload a new portrait image." }),
            new Paragraph({ text: "• Under 'About Ken', you can edit the 'Pull Quote' (the large highlight text) and the full 'Bio' text." }),
            new Paragraph({ text: "• Note: Leave a blank line in the text box to start a new paragraph." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF ABOUT/BIO CRM EDITING HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Feature 3: The Book Catalog",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Where it is on the website:", bold: true }),
            new Paragraph({ text: "The main focus of the website. Books are categorized into two visually distinct shelves: 'Available Now' and 'Coming Soon'. Visitors can click on any book to see more details." }),
            new Paragraph({ text: "How to edit and change it in the CRM:", bold: true }),
            new Paragraph({ text: "• In the CRM, click on the 'Books' tab." }),
            new Paragraph({ text: "• You will see a list of all your books. Click on a book to edit it, or click 'Add a Book'." }),
            new Paragraph({ text: "• To move a book from the 'Coming Soon' shelf to the 'Available Now' shelf on the live site, simply change the 'Status' dropdown from 'Coming Soon' to 'Available'." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF BOOKS LIST IN CRM HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Feature 4: The Individual Book Details & Purchase Links",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Where it is on the website:", bold: true }),
            new Paragraph({ text: "When a visitor clicks on a specific book cover, it opens that book's dedicated page showing the cover, description, page count, ISBN, and large 'Buy on Amazon' / 'Buy on Audible' buttons." }),
            new Paragraph({ text: "How to edit and change it in the CRM:", bold: true }),
            new Paragraph({ text: "• In the CRM, click on the 'Books' tab, then click on the book you want to edit." }),
            new Paragraph({ text: "• You can upload a new cover image." }),
            new Paragraph({ text: "• You can update the Title, Tagline, Description, Pages, and ISBN." }),
            new Paragraph({ text: "• To make the 'Buy' buttons appear on the live site, paste your Amazon or Audible link into the 'Purchase Links' section. (If you leave a link blank, that specific button will automatically hide itself on the live site)." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF BOOK EDIT DETAILS CRM HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Feature 5: The Interactive 3D Flipbook Reader",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Where it is on the website:", bold: true }),
            new Paragraph({ text: "On an individual book page, visitors will see a 'Read Sample' section. Clicking this opens a gorgeous, interactive 3D flipbook that feels like reading a physical book, allowing them to flip through a sample chapter." }),
            new Paragraph({ text: "How to edit and change it in the CRM:", bold: true }),
            new Paragraph({ text: "• In the CRM, click on the 'Books' tab, then click on a book." }),
            new Paragraph({ text: "• Scroll down to the 'Sample chapter' section." }),
            new Paragraph({ text: "• You can upload a PDF (.pdf), Word document (.docx), or Text file (.txt). The system will automatically extract the text." }),
            new Paragraph({ text: "• The flipbook engine automatically formats the text, seamlessly packing it to exactly 16 lines per page with no gaps, to mimic a real physical book." }),
            new Paragraph({ text: "• To create a scene break in the chapter, type '***' on its own line." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF FLIPBOOK SAMPLE UPLOAD IN CRM HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Feature 6: The Cinematic Video Trailers",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Where it is on the website:", bold: true }),
            new Paragraph({ text: "Videos appear in two places. First, the top video is featured prominently on the homepage, with smaller videos beside it. Second, if a video title matches a book title, the video will automatically embed itself onto that specific book's page." }),
            new Paragraph({ text: "How to edit and change it in the CRM:", bold: true }),
            new Paragraph({ text: "• In the CRM, click on the 'Videos' tab." }),
            new Paragraph({ text: "• Paste any YouTube URL into the box. The CRM will automatically fetch the video and its title." }),
            new Paragraph({ text: "• You can use the UP and DOWN arrows next to any video to change their order." }),
            new Paragraph({ text: "• The video at the very top of the list is always the one featured largest on the homepage." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF VIDEOS PAGE IN CRM HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "Feature 7: Advance Reader Signups & Notifications",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Where it is on the website:", bold: true }),
            new Paragraph({ text: "When a visitor views a book on the 'Coming Soon' shelf, instead of purchase buttons, they see a form to sign up as an 'Advance Reader' for that specific book." }),
            new Paragraph({ text: "How to edit and change it in the CRM:", bold: true }),
            new Paragraph({ text: "• In the CRM, click on the 'Readers' tab." }),
            new Paragraph({ text: "• Here you will see a list of every visitor who has signed up to be an advance reader." }),
            new Paragraph({ text: "• You can filter the list to see who requested eBook formats vs. Paperback formats." }),
            new Paragraph({ text: "• Click the 'Export CSV' button to download this list for your email newsletter software." }),
            new Paragraph({ text: "• To control where you receive email alerts when someone signs up, go to the 'About' tab, and update the 'Notification Email' at the bottom of the page." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF READERS LIST IN CRM HERE ]" }),
            new Paragraph({ text: "" }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Ken_Merrell_Full_Platform_Guide.docx", buffer);
    console.log("Detailed feature guide created!");
});
