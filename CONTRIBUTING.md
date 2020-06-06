# Contributing to RuneJS

RuneJS was created with the intention of utilizing JavaScript/TypeScript and Node's innovative features. RxJS was imported for reactive programming as well, opening up opportunities for easy content development. As such, there are a few things we're looking to avoid...

1. Direct ports/copying from Java servers
    - This defeats the purpose of RuneJS by implementing basic flows that any regular Java-based server would use. Think outside the box and really utilize ES6, TypeScript, Node, and RxJS! :)
2. Additional/outside dependencies
    - Sometimes additional dependencies cannot be avoided, but we'd like to avoid them as much as possible. RuneJS intends to be simple and easy for anyone to pick up, without requiring the user to set up any databases or additional third party systems.
    - In some cases this is of course unavoidable, as such we'll handle them on a case-by-case basis. 
    
Ultimately if you're looking to contribute, it's best to check in with us on Discord to see if we're already working on a specific feature or have plans for it already. Add us at **TheBlackParade#1260**
    
## Code Style

We do have a few coding styles and lint rules we'd like all contributors to adhere to. **Please run the linter via `npm run lint` before submitting any Pull Requests**:

- 4 space indentation 
- Spaces between TS/ES6 import/export braces
  - `import { this } from 'that';` instead of `import {this} from 'that';`
- Semicolon line endings
  - `let myVariable = true;` instead of only `let myVariable = true`
- Single quotes instead of double quotes
  - `let myString = 'hello world!';` instead of `let myString = "hello world";`
  - `import { this } from 'that';` instead of `import { this } from "that";`
- Avoid the `var` keyword
  - `let myVariable;` instead of `var myVariable;`
- Prefer `const` to `let`
  - If a variable is never going to be modified, please declare it using `const` instead of `let`
  - `const neverChanged = true;` instead of `let neverChanged = true;`
- Add types to all method parameters and return types to all methods
  - `public myMethod(firstParam: string, secondParam: number): void {` instead of `public myMethod(firstParam, secondParam) {`
- Add `public`, `private`, or `protected` to every class variable or method
  - `public myMethod(): void {` instead of `myMethod(): void {`
  - `private myVar: number;` instead of `myVar: number;`
- Use TypeScript getters/setters instead of specific getter/setter methods
  - `public get myVar(): number` instead of `public getMyVar(): number`
  - `public set myVar(myVar: number)` instead of `public setMyVar(myVar: number)`
