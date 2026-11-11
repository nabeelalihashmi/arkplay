# The Ark Programming Language

by Nabeel Ali Hashmi

[nabeelhashmi.com](https://nabeelhashmi.com) &nbsp;·&nbsp; [Arkivya](https://arkivya.com) &nbsp;·&nbsp; [Play online](https://nabeelalihashmi.github.io/arkplay/)

The Ark Programming Language is a general purpose programming language for every one, built from base to bloom elegance with eloquent syntax bringing ease with speed.

We can write programs at the speed of a dynamic language having safety of statically typed language and running at the speed of compiled language.

As a matter of fact, this language is designed to be easy to use to get picked by schools as first programming language to teach.


```ark
message = "Hello World!"
print(message)
```


## Examples
Check These

```ark
name = "Nabeel Ali Hashmi"
print("The name is ${name}")

list = ["Hello", 12, "World"]

dynamic x = 5
x = "Hello"

for (item in list) {
    print("item: ${item}")
}

marks = 90
grade = match(marks) {
    (_ > 90) => 'A',
    (_ <= 90 && _ > 80) => 'B',
    (_ <= 80 && _ > 70) => 'C',
    default => 'F',
}
print(grade)
```



```ark
function sum(nums) {
    total = 0
    for (i in nums) {
        total += i
    }
    return total
}

function square(num) {
    return num * num
}

ints = [1, 2, 3]

total = sum(ints)
demo = ints |> sum |> square
print("${total}, ${demo}")
```


## What Ark feels like

- Static types without ceremony.
- Generics with readable bounds, traits, classes, records.
- The Go ecosystem, reachable from Ark code.
- One language for real work: command line tools, gui apps, web apps, games, Android apps etc
- Built to welcome new programmers. The syntax says what it does, and the compiler's errors point at the line and the reason.

## Playground

This repository ships ArkPlay: a full Ark playground that runs in the browser — the compiler is compiled to WebAssembly, so everything (checking, codegen, execution) happens locally on your machine. Nothing is uploaded.

- **Examples gallery** — the book icon in the top bar opens 13 runnable examples covering the language: hello world, variables, functions, control flow, match, arrays, maps, strings, classes, records & enums, generics, errors, and a two-file modules example. Loading one replaces the editor's project; every example is verified against the compiler.
- **First visit** — a fresh session starts with a Hello World program already loaded and ready to run.
- **Multi-file projects** — add files in the sidebar, pick the entry file that Run compiles, and `use "./file"` to import between them.
- **Instant feedback** — Run shows output in the built-in terminal; check errors surface with the same line-and-reason diagnostics the CLI prints.
- **Your work persists** — projects are saved in your browser (localStorage), so a refresh keeps your code.
- **Editor** — Monaco with Ark syntax highlighting, vim mode, font zoom (Ctrl +/−), format-on-demand.

## Status

Ark is in close alpha. Updates are published on LinkedIn.

## License

The Ark Playground is released under the [MIT License](LICENSE) — Copyright © 2026 Nabeel Ali Hashmi.

Third-party components (Monaco Editor, monaco-vim, wasm_exec.js, IBM Plex Mono, yaegi) remain under their own licenses — see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

