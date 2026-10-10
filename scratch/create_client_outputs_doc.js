const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType
} = require('docx');

// Colors
const COLOR_DARK = '1A202C';
const COLOR_GOLD = 'C9A860';
const COLOR_MUTED = '64748B';
const COLOR_LIGHT_BG = 'F8FAFC';
const COLOR_CARD_BG = 'F1F5F9';
const COLOR_BORDER = 'CBD5E1';
const COLOR_WHITE = 'FFFFFF';
const COLOR_GREEN = '15803D';
const COLOR_BLUE = '1D4ED8';
const COLOR_HEADER_BG = '1E293B';

const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: COLOR_BORDER,
};

const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};

const cleanBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

function createHeaderCell(text, widthPercent) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 140, bottom: 140, left: 160, right: 160 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: text,
            bold: true,
            color: COLOR_WHITE,
            size: 20, // 10pt
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function createDataCell(text, widthPercent, isBold = false, color = '000000', align = AlignmentType.LEFT, bgFill = COLOR_WHITE) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: bgFill, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: text,
            bold: isBold,
            color: color,
            size: 19, // 9.5pt
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function createCardCell(title, value, subtitle, widthPercent, accentColor = COLOR_GOLD) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_CARD_BG, type: ShadingType.CLEAR },
    margins: { top: 160, bottom: 160, left: 180, right: 180 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: accentColor },
      bottom: tableBorder,
      left: tableBorder,
      right: tableBorder,
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: title.toUpperCase(), size: 17, color: COLOR_MUTED, bold: true, font: 'Calibri' })
        ]
      }),
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: value, size: 36, color: COLOR_DARK, bold: true, font: 'Calibri' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: subtitle, size: 17, color: COLOR_MUTED, font: 'Calibri' })
        ]
      })
    ]
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Calibri',
          size: 22,
          color: '2D3748',
        },
        paragraph: {
          spacing: { line: 280 },
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "Ken Merrell Author Platform",
              size: 24,
              color: COLOR_GOLD,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Analytics & Ad Tracking: Client Dashboard Screens",
              bold: true,
              size: 40,
              color: COLOR_DARK,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 360 },
          children: [
            new TextRun({
              text: "This document illustrates exclusively the visual outputs, reports, and interactive screens that Ken will see inside his private Author Admin Portal (/admin/analytics). Ken does not need to log into any third-party tools—every metric, campaign comparison, and individual visitor journey is presented in one clean place.",
              color: COLOR_MUTED,
              size: 21,
            }),
          ],
        }),

        // Divider
        new Paragraph({
          border: { bottom: { color: COLOR_GOLD, size: 6, style: BorderStyle.SINGLE } },
          spacing: { after: 300 },
        }),

        // SCREEN 1: KPI CARDS
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [
            new TextRun({ text: "Screen Output 1: Executive KPI Cards (Top Banner)", bold: true, color: COLOR_DARK, size: 28 })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "When Ken opens the Analytics page, he is greeted at the very top by 4 clean cards providing an instant health check of today's advertising and organic traffic:" })
          ]
        }),

        // Table for KPI cards
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createCardCell("Today's Viewers", "142", "+28% vs yesterday", 25, COLOR_GOLD),
                createCardCell("This Week", "1,120", "Active ad running", 25, COLOR_BLUE),
                createCardCell("Amazon Clicks", "82", "21.7% Intent Rate", 25, COLOR_GREEN),
                createCardCell("New ARC Signups", "16", "Direct readers joined", 25, COLOR_GOLD),
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 160 } }),

        // Mini split card
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  borders: {
                    left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLUE },
                    top: tableBorder, bottom: tableBorder, right: tableBorder
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "TRAFFIC SPLIT TODAY:  ", bold: true, color: COLOR_BLUE, size: 19 }),
                        new TextRun({ text: "Paid Ads: 65% (92 visitors)  |  Organic (Bio, Posts, Search): 35% (50 visitors)", color: COLOR_DARK, size: 19 }),
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 360 } }),

        // SCREEN 2: 30-DAY TRAFFIC CHART & TOP PAGES
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [
            new TextRun({ text: "Screen Output 2: 30-Day Traffic Trend & Top Pages", bold: true, color: COLOR_DARK, size: 28 })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "A visual timeline chart shows daily visitor spikes matching Ken's ad launch dates, accompanied by top pages visited:" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell("Page / Section", 50),
                createHeaderCell("Visits", 25),
                createHeaderCell("% of Total", 25),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("The Iron Gate (Book Page)", 50, true),
                createDataCell("1,450", 25, false, '000000', AlignmentType.RIGHT),
                createDataCell("42%", 25, false, COLOR_BLUE, AlignmentType.RIGHT),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("Homepage & Book Showcase", 50, true),
                createDataCell("1,120", 25, false, '000000', AlignmentType.RIGHT),
                createDataCell("32%", 25, false, COLOR_BLUE, AlignmentType.RIGHT),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("Advance Reader Signup Page", 50, true),
                createDataCell("580", 25, false, '000000', AlignmentType.RIGHT),
                createDataCell("17%", 25, false, COLOR_BLUE, AlignmentType.RIGHT),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("About Ken Merrell (Author Bio)", 50, true),
                createDataCell("300", 25, false, '000000', AlignmentType.RIGHT),
                createDataCell("9%", 25, false, COLOR_BLUE, AlignmentType.RIGHT),
              ]
            }),
          ]
        }),

        new Paragraph({ spacing: { after: 360 } }),

        // SCREEN 3: AD CAMPAIGN LEADERBOARD TABLE
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [
            new TextRun({ text: "Screen Output 3: Advertising & Organic Campaign Leaderboard", bold: true, color: COLOR_DARK, size: 28 })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "This table gives Ken direct visibility into which promotional efforts actually convert readers to Amazon or Advance Reader signups:" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell("Campaign Name", 28),
                createHeaderCell("Channel & Type", 22),
                createHeaderCell("Visitors", 12),
                createHeaderCell("Amazon Clicks", 13),
                createHeaderCell("ARC Signups", 12),
                createHeaderCell("Conv. Rate", 13),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("Spring Fantasy Launch", 28, true),
                createDataCell("Instagram Paid Ad Trail", 22, false, COLOR_BLUE),
                createDataCell("450", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("82", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
                createDataCell("16", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("21.7%", 13, true, COLOR_DARK, AlignmentType.RIGHT),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("BookBub Featured Deal", 28, true),
                createDataCell("BookBub Paid Promo", 22, false, COLOR_BLUE),
                createDataCell("720", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("215", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
                createDataCell("28", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("33.7%", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("Instagram Profile Bio Link", 28, true),
                createDataCell("Instagram Organic (Free)", 22, false, COLOR_GOLD),
                createDataCell("140", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("45", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
                createDataCell("21", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("47.1%", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("Author Newsletter May", 28, true),
                createDataCell("Email Broadcast", 22, false, COLOR_GOLD),
                createDataCell("130", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("35", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
                createDataCell("48", 12, true, COLOR_GOLD, AlignmentType.RIGHT),
                createDataCell("63.8%", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("Facebook Boosted Post", 28, true),
                createDataCell("Facebook Paid Ad", 22, false, COLOR_BLUE),
                createDataCell("210", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("38", 13, true, COLOR_GREEN, AlignmentType.RIGHT),
                createDataCell("9", 12, false, '000000', AlignmentType.RIGHT),
                createDataCell("22.3%", 13, true, COLOR_DARK, AlignmentType.RIGHT),
              ]
            }),
          ]
        }),

        new Paragraph({
          spacing: { before: 120, after: 360 },
          children: [
            new TextRun({ text: "Takeaway for Ken: ", bold: true, color: COLOR_DARK, size: 19 }),
            new TextRun({ text: "Ken immediately sees that BookBub produced the highest volume of Amazon buyers (215 clicks), while his free Instagram Bio link had a remarkable 47.1% conversion rate for zero advertising dollars.", color: COLOR_MUTED, size: 19 })
          ]
        }),

        // SCREEN 4: 1-CLICK CAMPAIGN LINK GENERATOR
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [
            new TextRun({ text: "Screen Output 4: 1-Click Campaign Link Generator", bold: true, color: COLOR_DARK, size: 28 })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Ken does not need to learn complicated UTM syntax. Inside his admin, this simple 10-second generator builds ready-to-copy links:" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { fill: COLOR_CARD_BG, type: ShadingType.CLEAR },
                  margins: { top: 160, bottom: 160, left: 200, right: 200 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_GOLD },
                    bottom: tableBorder, left: tableBorder, right: tableBorder
                  },
                  children: [
                    new Paragraph({
                      spacing: { after: 100 },
                      children: [
                        new TextRun({ text: "CAMPAIGN LINK BUILDER", bold: true, color: COLOR_DARK, size: 22 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "1. Select Book:  ", bold: true, color: COLOR_MUTED, size: 20 }),
                        new TextRun({ text: "[ The Iron Gate (Paperback & Kindle)  v ]", color: COLOR_DARK, size: 20 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "2. Platform:      ", bold: true, color: COLOR_MUTED, size: 20 }),
                        new TextRun({ text: "[ Instagram Paid Ad  v ]", color: COLOR_DARK, size: 20 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 120 },
                      children: [
                        new TextRun({ text: "3. Campaign:    ", bold: true, color: COLOR_MUTED, size: 20 }),
                        new TextRun({ text: "[ May2026_Trailer_Ad ]", color: COLOR_DARK, size: 20 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { before: 80, after: 120 },
                      children: [
                        new TextRun({ text: "GENERATED TRACKING LINK (Ready to paste into Meta Ads):", bold: true, color: COLOR_GOLD, size: 18 })
                      ]
                    }),
                    new Paragraph({
                      shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                      borders: cellBorders,
                      spacing: { before: 60, after: 100 },
                      children: [
                        new TextRun({
                          text: " https://www.kenmerrell.com/books/the-iron-gate?utm_source=instagram&utm_medium=paid_ad&utm_campaign=May2026_Trailer_Ad ",
                          size: 19,
                          color: COLOR_BLUE
                        })
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "[  COPY LINK TO CLIPBOARD  ]", bold: true, color: COLOR_GOLD, size: 20 })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 360 } }),

        // SCREEN 5: LIVE VISITOR JOURNEY FEED
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [
            new TextRun({ text: "Screen Output 5: Live Visitor Journey Feed (Every Single User)", bold: true, color: COLOR_DARK, size: 28 })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "This is Ken's live log showing every individual person who visits the site. Ken can filter by 'Clicked Amazon', 'ARC Signups', or 'Paid Ads Only':" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell("Time", 12),
                createHeaderCell("User ID", 14),
                createHeaderCell("Traffic Source / Ad", 26),
                createHeaderCell("Location", 18),
                createHeaderCell("Device", 12),
                createHeaderCell("Outcome", 18),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("03:42 PM", 12),
                createDataCell("#USR-8422", 14, true, COLOR_BLUE),
                createDataCell("Instagram Story Ad", 26, false, COLOR_BLUE),
                createDataCell("Austin, TX", 18),
                createDataCell("iPhone", 12),
                createDataCell("[CLICKED AMAZON]", 18, true, COLOR_GREEN),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("03:38 PM", 12),
                createDataCell("#USR-8421", 14, true, COLOR_BLUE),
                createDataCell("Facebook: Spring Promo", 26, false, COLOR_BLUE),
                createDataCell("London, UK", 18),
                createDataCell("Windows", 12),
                createDataCell("[ARC SIGNUP: John]", 18, true, COLOR_GOLD),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("03:25 PM", 12),
                createDataCell("#USR-8420", 14, true, COLOR_BLUE),
                createDataCell("Google Search (Organic)", 26, false, COLOR_MUTED),
                createDataCell("Chicago, IL", 18),
                createDataCell("Android", 12),
                createDataCell("Exited (30s)", 18, false, COLOR_MUTED),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("03:10 PM", 12),
                createDataCell("#USR-8419", 14, true, COLOR_BLUE),
                createDataCell("BookBub Deal", 26, false, COLOR_BLUE),
                createDataCell("Toronto, CA", 18),
                createDataCell("iPad", 12),
                createDataCell("[CLICKED AMAZON]", 18, true, COLOR_GREEN),
              ]
            }),
            new TableRow({
              children: [
                createDataCell("02:54 PM", 12),
                createDataCell("#USR-8418", 14, true, COLOR_BLUE),
                createDataCell("Instagram Profile Bio (Free)", 26, false, COLOR_GOLD),
                createDataCell("Seattle, WA", 18),
                createDataCell("iPhone", 12),
                createDataCell("[ARC SIGNUP: Sarah]", 18, true, COLOR_GOLD),
              ]
            }),
          ]
        }),

        new Paragraph({ spacing: { after: 360 } }),

        // SCREEN 6: INDIVIDUAL VISITOR CLICKSTREAM TIMELINE
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [
            new TextRun({ text: "Screen Output 6: Individual Visitor Clickstream Timeline", bold: true, color: COLOR_DARK, size: 28 })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "When Ken clicks on any visitor row (e.g., #USR-8422), a detailed slide-out drawer opens showing the visitor's exact step-by-step path through the site:" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { fill: COLOR_CARD_BG, type: ShadingType.CLEAR },
                  margins: { top: 160, bottom: 160, left: 200, right: 200 },
                  borders: {
                    left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_GREEN },
                    top: tableBorder, bottom: tableBorder, right: tableBorder
                  },
                  children: [
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "VISITOR #USR-8422 PROFILE", bold: true, color: COLOR_DARK, size: 22 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 140 },
                      children: [
                        new TextRun({ text: "Acquired via: ", bold: true, color: COLOR_MUTED, size: 19 }),
                        new TextRun({ text: "Instagram Story Ad (Campaign: book_trailer_v2)  |  ", color: COLOR_DARK, size: 19 }),
                        new TextRun({ text: "Location: ", bold: true, color: COLOR_MUTED, size: 19 }),
                        new TextRun({ text: "Austin, Texas, USA  |  ", color: COLOR_DARK, size: 19 }),
                        new TextRun({ text: "Device: ", bold: true, color: COLOR_MUTED, size: 19 }),
                        new TextRun({ text: "iPhone (Safari)  |  ", color: COLOR_DARK, size: 19 }),
                        new TextRun({ text: "Total Time: ", bold: true, color: COLOR_MUTED, size: 19 }),
                        new TextRun({ text: "4m 12s", bold: true, color: COLOR_GREEN, size: 19 })
                      ]
                    }),
                    new Paragraph({
                      border: { bottom: { color: COLOR_BORDER, size: 4, style: BorderStyle.SINGLE } },
                      spacing: { after: 120 },
                      children: [
                        new TextRun({ text: "CHRONOLOGICAL CLICKSTREAM TIMELINE:", bold: true, color: COLOR_DARK, size: 19 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "03:42:10 PM  ", bold: true, color: COLOR_BLUE, size: 18 }),
                        new TextRun({ text: "Landed on /books/the-iron-gate from Instagram ad swipe", color: COLOR_DARK, size: 18 }),
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "03:42:45 PM  ", bold: true, color: COLOR_BLUE, size: 18 }),
                        new TextRun({ text: "Clicked 'Watch Book Trailer' (watched for 1 minute 15 seconds)", color: COLOR_DARK, size: 18 }),
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "03:44:00 PM  ", bold: true, color: COLOR_BLUE, size: 18 }),
                        new TextRun({ text: "Scrolled down to read Editorial Reviews & Quotes", color: COLOR_DARK, size: 18 }),
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "03:44:50 PM  ", bold: true, color: COLOR_BLUE, size: 18 }),
                        new TextRun({ text: "Navigated to /author ('About Ken Merrell') - Read author bio for 1m 20s", color: COLOR_DARK, size: 18 }),
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "03:46:10 PM  ", bold: true, color: COLOR_BLUE, size: 18 }),
                        new TextRun({ text: "Navigated back to /books/the-iron-gate", color: COLOR_DARK, size: 18 }),
                      ]
                    }),
                    new Paragraph({
                      shading: { fill: 'DCFCE7', type: ShadingType.CLEAR },
                      borders: cellBorders,
                      spacing: { before: 80, after: 80 },
                      children: [
                        new TextRun({ text: " 03:46:22 PM  *** CLICKED 'BUY ON AMAZON' BUTTON *** -> Forwarded to Amazon ", bold: true, color: COLOR_GREEN, size: 19 }),
                      ]
                    }),
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 360 } }),

        // SCREEN 7: READER CRM IDENTITY BRIDGING
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [
            new TextRun({ text: "Screen Output 7: Reader CRM Profile (Identity Bridging)", bold: true, color: COLOR_DARK, size: 28 })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "When an anonymous visitor signs up for Ken's Advance Reader Team, their entire origin is permanently recorded inside Ken's Reader CRM (/admin/readers):" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { fill: COLOR_CARD_BG, type: ShadingType.CLEAR },
                  margins: { top: 160, bottom: 160, left: 200, right: 200 },
                  borders: {
                    left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_GOLD },
                    top: tableBorder, bottom: tableBorder, right: tableBorder
                  },
                  children: [
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [
                        new TextRun({ text: "READER RECORD: JANE DOE", bold: true, color: COLOR_DARK, size: 22 }),
                        new TextRun({ text: "  (Verified ARC Reader)", color: COLOR_GREEN, size: 18, bold: true })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "Email Address: ", bold: true, color: COLOR_MUTED, size: 19 }),
                        new TextRun({ text: "jane.doe@example.com  |  ", color: COLOR_DARK, size: 19 }),
                        new TextRun({ text: "Format Requested: ", bold: true, color: COLOR_MUTED, size: 19 }),
                        new TextRun({ text: "Paperback & Ebook", color: COLOR_DARK, size: 19 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: "Book Assigned: ", bold: true, color: COLOR_MUTED, size: 19 }),
                        new TextRun({ text: "The Iron Gate", bold: true, color: COLOR_GOLD, size: 19 })
                      ]
                    }),
                    new Paragraph({
                      shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
                      borders: cellBorders,
                      spacing: { before: 80, after: 80 },
                      children: [
                        new TextRun({ text: " ACQUISITION TRAIL: ", bold: true, color: '92400E', size: 19 }),
                        new TextRun({ text: "Facebook Ad (Campaign: Spring_Launch_Promo)  |  Session: #USR-8421  |  Visited 2 pages prior to joining", color: '78350F', size: 18 })
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Ken can now send Jane review reminder emails, mark her paperback as mailed, and know exactly which paid ad brought her into his reader community.", color: COLOR_MUTED, size: 18 })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 360 } }),

        // Summary footer
        new Paragraph({
          border: { top: { color: COLOR_BORDER, size: 4, style: BorderStyle.SINGLE } },
          spacing: { before: 300, after: 120 },
          children: [
            new TextRun({ text: "Summary for Ken: ", bold: true, color: COLOR_DARK, size: 20 }),
            new TextRun({ text: "All 7 screen outputs live inside Ken's website at www.kenmerrell.com/admin/analytics. Ken never has to configure Google Analytics, log into Meta Ads Manager, or hire an analytics agency. Everything is instant, automatic, and custom-tailored to author success.", color: COLOR_MUTED, size: 19 })
          ]
        }),

      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = path.join(process.cwd(), 'Ken_Merrell_Analytics_Dashboard_Outputs.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('SUCCESS: Document created at ' + outputPath);
}).catch(err => {
  console.error('ERROR creating document:', err);
  process.exit(1);
});
