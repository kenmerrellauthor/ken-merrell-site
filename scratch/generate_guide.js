const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Ken Merrell Website & CRM Guide",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "Welcome to the Ken Merrell author platform. This guide explains how to manage your books, videos, advance reader signups, and website content using the built-in Content Management System (CRM).",
            }),
            new Paragraph({ text: "" }),
            
            new Paragraph({
                text: "1. Accessing the CRM",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                children: [
                    new TextRun("To access the backend CRM where you can make changes to the site:"),
                ],
            }),
            new Paragraph({ text: "1. Go to your website." }),
            new Paragraph({ text: "2. Add /admin to the end of the URL (e.g., www.kenmerrell.com/admin)." }),
            new Paragraph({ text: "3. Log in with your secure administrator credentials." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF LOGIN SCREEN HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "2. The Books Section",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "The Books section allows you to add new books, edit existing ones, or move a book from 'Coming soon' to 'Available' when it launches." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF BOOK DASHBOARD HERE ]" }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Adding / Editing a Book:" }),
            new Paragraph({ text: "• Status: Choose if the book is 'Available' or 'Coming Soon'." }),
            new Paragraph({ text: "• Cover Image: Upload the front cover image of the book." }),
            new Paragraph({ text: "• Details: Enter the Title, Tagline, Description, Pages, and ISBN." }),
            new Paragraph({ text: "• Purchase Links: Paste your Amazon and Audible links here to display the Buy buttons on the website." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF BOOK EDIT FORM HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "3. The 3D Flipbook Sample Chapters",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "When editing a book, you can provide a sample chapter for the interactive 3D Flipbook reader that users see on the site." }),
            new Paragraph({ text: "• Go to the 'Sample Chapter' section at the bottom of the book edit form." }),
            new Paragraph({ text: "• You can directly upload a PDF file (.pdf), Word document (.docx), or Text file (.txt)." }),
            new Paragraph({ text: "• Alternatively, you can paste the raw text directly into the text box." }),
            new Paragraph({ text: "• Important Formatting Notes:" }),
            new Paragraph({ text: "  - The flipbook will automatically format the text to look exactly like a real physical book." }),
            new Paragraph({ text: "  - It automatically packs the lines perfectly to fill each page (exactly 16 lines) without gaps." }),
            new Paragraph({ text: "  - Leave a blank line between paragraphs." }),
            new Paragraph({ text: "  - Scene breaks can be created by typing '***' on its own line." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF SAMPLE UPLOAD AREA HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "4. The About Section (Author & Bio)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "The 'About' tab controls what visitors see in the About section on the site, the quotes on the homepage, and your contact settings." }),
            new Paragraph({ text: "• Author Photo: Upload your professional headshot here." }),
            new Paragraph({ text: "• About Ken: Edit your main bio and the 'pull quote' that highlights it." }),
            new Paragraph({ text: "• Homepage Quotes: These are the praise quotes that swipe back and forth under the homepage banner. You can add, edit, or remove them here. Three or four quotes work best." }),
            new Paragraph({ text: "• Links: Paste the URL to your Amazon Author Page and YouTube Channel." }),
            new Paragraph({ text: "• Notification Email: Set the email address where all website messages and advance reader signups will be sent. (This email is private and never shown on the live site)." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF ABOUT PAGE HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "5. The Videos Section",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "The 'Videos' tab allows you to easily manage the cinematic book trailers and other videos that play directly on your website." }),
            new Paragraph({ text: "• Adding a Video: Simply paste a YouTube link into the box. The CRM will automatically fetch the video title." }),
            new Paragraph({ text: "• Layout: The top video on the list is featured large on the homepage, while the next two appear beside it. " }),
            new Paragraph({ text: "• Reordering: Use the UP and DOWN arrows next to any video to change the order." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF VIDEOS PAGE HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "6. The Readers Section (Advance Signups)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "The 'Readers' tab keeps track of visitors who have signed up to be advance readers for your upcoming 'Coming Soon' books." }),
            new Paragraph({ text: "• You can view the list of people who signed up." }),
            new Paragraph({ text: "• You can filter the list to see who wants an eBook version versus a Paper version." }),
            new Paragraph({ text: "• Click the 'Export CSV' button to download the list for your email marketing software or spreadsheet." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "[ INSERT SCREENSHOT OF READERS PAGE HERE ]" }),
            new Paragraph({ text: "" }),

            new Paragraph({
                text: "7. Publishing Changes",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Whenever you make changes to books, videos, or the About section:" }),
            new Paragraph({ text: "• You must click the green 'Save Changes' button at the top right of the page." }),
            new Paragraph({ text: "• Saving changes instantly updates the live website." }),
            new Paragraph({ text: "• If you visit the live website and don't immediately see the changes, perform a 'Hard Refresh' in your browser (Ctrl+F5 on Windows, or Cmd+Shift+R on Mac)." }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Ken_Merrell_Client_Guide.docx", buffer);
    console.log("Accurate Guide created!");
});
