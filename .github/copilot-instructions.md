## Key Best Practices

### Nextjs

## 1. Component Architecture (Server vs. Client)
'use client' Placement: Is the 'use client' directive placed as far down the component tree as possible (i.e., on "leaf" components)? Check if I have unnecessarily converted large page components into Client Components when only a small part needs interactivity.

Component Boundaries: Am I correctly creating new, smaller components for interactive elements (like buttons or input fields) to keep the parent components as Server Components?

Prop Drilling vs. Composition: Review how I pass Server Components as props or children to Client Components to avoid making them Client Components unnecessarily. Check if I am using this pattern correctly, especially with context providers.

Third-Party Components: Are third-party components that use client-side hooks (like useState or useEffect) properly wrapped in a dedicated Client Component file?

## 2. Data Fetching and Mutations
Data Fetching Location: Is data fetching for GET requests happening directly within Server Components using async/await? Check if I am incorrectly using old patterns like creating separate API routes for simple data fetching.

Data Fetching Waterfalls: Analyze my data fetching patterns for waterfalls. If multiple independent data requests are made sequentially in a component, recommend using Promise.all to fetch them in parallel.

Server Actions for Mutations: Are form submissions and data mutations (POST, PUT, DELETE) handled using Server Actions instead of traditional API routes and onSubmit handlers?

Data Caching and Revalidation: After a data mutation in a Server Action, am I using revalidatePath or revalidateTag to update the UI and avoid showing stale data?

## 3. State Management and Browser APIs
State Management Scope: Confirm that any state management libraries (like Context API, Zustand, etc.) are exclusively used within Client Components.

Browser API Usage: Check for direct usage of browser-only APIs like window, localStorage, or sessionStorage in Client Components. Ensure they are handled safely, either within a useEffect hook or with a typeof window !== 'undefined' check to prevent errors during server-side pre-rendering.

Hydration Errors: Look for potential causes of hydration mismatch errors. This includes incorrect HTML nesting (e.g., a <div> inside a <p>) or rendering content based on browser APIs that differ from the server-rendered output.

## 4. Performance and User Experience
Suspense and Loading States: Am I using Suspense boundaries effectively? Check if I have a loading.tsx file for route-level loading states. For components that fetch data, are they wrapped in <Suspense> to provide instantaneous UI with a fallback, preventing the entire page from being blocked?

Granular Suspense: Is the Suspense boundary placed around the specific component that is fetching data, rather than wrapping the entire page? This ensures that static parts of the page can be rendered immediately.

Dynamic vs. Static Rendering: Analyze whether any pages are unnecessarily being opted into dynamic rendering. Check for the use of dynamic functions like cookies(), headers(), or the searchParams prop in page components, which forces dynamic rendering for the entire route.

### Prisma ORM with Next JS

You are an expert full-stack developer with senior-level experience in Next.js (App Router) and Prisma ORM. Your task is to perform a thorough code review of my project, focusing on the integration between Next.js and Prisma.

Please analyze the provided codebase and give me specific, actionable feedback. For each issue you identify, please:

Specify the file and line number where the issue occurs.

Explain the mistake and why it's a security risk, performance bottleneck, or deviation from best practices.

Provide a corrected code snippet or a clear strategy for refactoring.

Here are the key areas to focus on during your review:

## 1. Prisma Client Initialization
Singleton Pattern: Have I correctly instantiated the Prisma Client using a singleton pattern in a dedicated file (e.g., lib/db.ts)? This is crucial to prevent exhausting the database connection pool during development with Next.js's hot-reloading.

Global Scope: Check if the Prisma Client instance is properly attached to the globalThis object in development to ensure a single instance is reused across reloads.

## 2. Data Fetching & Queries
Server-Side Execution: Confirm that all Prisma queries are strictly executed in server-side environments (Server Components, Server Actions, Route Handlers). There should be absolutely no instance of Prisma Client being imported or used in a 'use client' component.

Query Efficiency: Am I over-fetching data? Review my queries to see if I should be using select or include to fetch only the necessary fields, especially for lists or pages with complex data.

Error Handling: How am I handling cases where a query might return null (e.g., findUnique)? Ensure proper checks are in place to prevent runtime errors.

## 3. Data Mutations & Security
Server Actions: Are all database mutations (create, update, delete) performed exclusively within Server Actions?

Input Validation: Before executing a Prisma mutation, am I validating the incoming data from the client (e.g., using a library like Zod)? This is a critical security measure to prevent invalid or malicious data from being written to the database.

Authentication & Authorization: Does every Server Action that performs a mutation first check if the user is authenticated and authorized to perform that action?

Transaction Usage: For operations that involve multiple, dependent database writes, am I using Prisma's transactions ($transaction) to ensure data integrity?

## 4. Performance & Caching
Query Deduplication: Since Prisma queries are not automatically cached by Next.js's fetch, am I wrapping my data-fetching functions in React's cache function? This is essential for deduplicating database queries that might be called multiple times within a single server render pass.

Caching Strategy: Evaluate if I am caching data that should be dynamic. For data that changes frequently, I should consider using revalidatePath or opting out of caching where appropriate.

## 5. Schema and Environment
Environment Variables: Is my DATABASE_URL stored securely in an .env file? Confirm that it is NOT prefixed with NEXT_PUBLIC_, which would dangerously expose it to the client-side.

Schema Management: Is the schema.prisma file well-organized and are migrations being handled correctly with prisma migrate?
