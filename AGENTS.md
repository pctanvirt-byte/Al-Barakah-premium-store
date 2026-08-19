# Project Instructions for AI Coding Assistants (AL BARAKAH PREMIUM)

## Core Directive & User Approval Rule
1. **MANDATORY CONFIRMATION BEFORE EDITING CODE**:
   - The user has strictly instructed: ALWAYS explain any issue, proposed architecture, and detailed plan first.
   - You MUST NOT modify, create, or delete any code or files without explicit user consent or permission (e.g. "হ্যাঁ", "করুন", "Go ahead", "অনুমতি দিলাম").

## Database & Persistence Rules
2. **Unified Single Database (Google Firebase Firestore)**:
   - Firestore is the single authoritative cloud database (`ai-studio-albarakahpremium-1c423778-d3e5-4a59-8d8e-d2a4694038d1`).
   - When any product, category, review, or order is deleted in the admin dashboard, it MUST execute `deleteDoc` directly in Firestore.
   - Do NOT forcefully inject sample/seed demo items back into state or local storage upon page refresh.
   - Firestore Security Rules in `firestore.rules` must be kept hardened.
