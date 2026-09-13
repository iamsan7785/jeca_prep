import type { Difficulty, Question, QuestionType } from "./types.js";

type SingleSpec = [topic: string, stem: string, correct: string, wrong1: string, wrong2: string, wrong3: string, explanation: string];
type MultipleSpec = [topic: string, stem: string, correct1: string, correct2: string, wrong1: string, wrong2: string, explanation: string];

const bank: Record<string, { singles: SingleSpec[]; multiple: MultipleSpec }> = {
  "C Programming": {
    singles: [
      ["Pointers", "What does the expression `*p` denote when p is a valid pointer to an int?", "The integer stored at the address held by p", "The address of p itself", "The size of p", "A pointer to p", "The unary * operator dereferences a valid pointer."],
      ["Arrays", "For `int a[8];`, what is the valid index range?", "0 through 7", "1 through 8", "0 through 8", "1 through 7", "C arrays are zero-indexed."],
      ["Strings", "Which character terminates a C string?", "The null character `\\0`", "A newline `\\n`", "A space", "The EOF character", "C string functions locate the end using the null terminator."],
      ["Functions", "Which storage duration does a local variable declared with `static` have?", "It retains its value between function calls", "It is recreated on every statement", "It is visible in every file", "It exists only during compilation", "A local static object has program lifetime while retaining block scope."],
      ["Recursion", "A recursive function must have which essential element?", "A base case that stops further calls", "At least two parameters", "A global variable", "A pointer return type", "The base case prevents unbounded recursive calls."],
      ["Structures", "Which operator accesses a member through a structure pointer?", "->", ".", "::", "&", "The arrow operator is shorthand for dereferencing then using dot."],
      ["File handling", "Which mode opens a text file for appending in C?", "a", "r", "w", "x", "Append mode writes at the end, creating the file when needed."],
      ["Memory", "Which function releases memory obtained with malloc?", "free", "delete", "release", "dispose", "malloc allocations are returned to the allocator with free."],
      ["Operators", "What is the result type of the C comparison expression `7 < 4`?", "int with value 0", "float with value 0.0", "char with value '0'", "A Boolean object", "C relational expressions produce an int value, zero for false."],
    ],
    multiple: ["Memory", "Which statements about dynamically allocated C memory are correct?", "Memory returned by malloc should eventually be freed", "calloc initializes allocated bytes to zero", "free automatically sets the pointer to NULL", "A malloc block can be used after free", "free does not change the caller's pointer, and use-after-free is invalid."],
  },
  "Data Structures": {
    singles: [
      ["Stacks", "Which traversal uses a stack implicitly or explicitly?", "Depth-first search", "Breadth-first search only", "Level-order traversal only", "Heap sort only", "DFS follows a path and needs a LIFO structure to return."],
      ["Queues", "Which ordering rule defines a queue?", "First in, first out", "Last in, first out", "Lowest key first", "Random access", "A queue serves the earliest enqueued item first."],
      ["Linked lists", "What is the time complexity of inserting at the head of a singly linked list when the head is known?", "O(1)", "O(log n)", "O(n)", "O(n log n)", "Only pointer updates are required at a known head."],
      ["Trees", "A binary tree node has at most how many children?", "Two", "One", "Three", "Unlimited", "The defining property of a binary tree is at most two children."],
      ["BST", "What is the inorder traversal of a binary search tree with distinct keys?", "Keys in sorted ascending order", "Keys in insertion order", "Keys in descending order only", "Always level order", "Inorder visits left subtree, node, then right subtree."],
      ["Sorting", "Which comparison sorting algorithm has worst-case O(n log n) time?", "Merge sort", "Insertion sort", "Selection sort", "Bubble sort", "Merge sort divides and merges in O(n log n) time."],
      ["Searching", "Binary search requires the collection to be", "Sorted", "A linked list", "Hashed", "Circular", "Binary search discards half based on order."],
      ["Hashing", "What is a collision in a hash table?", "Two keys map to the same table slot", "A key is deleted", "The table is sorted", "A queue becomes full", "A collision occurs when hashes coincide for different keys."],
      ["Complexity", "What is the time complexity of accessing an array element by index?", "O(1)", "O(log n)", "O(n)", "O(n²)", "An array address is computed directly from its base and index."],
    ],
    multiple: ["Graphs", "Which graph traversal facts are correct?", "BFS finds shortest path lengths in an unweighted graph", "DFS can be used to detect cycles", "BFS always uses recursion", "DFS requires a priority queue", "BFS uses a queue; DFS commonly uses recursion or a stack."],
  },
  "Operating Systems": {
    singles: [
      ["Processes", "A program in execution is called a", "Process", "Thread pool", "File descriptor", "Page", "A process is the executing instance of a program."],
      ["Threads", "Threads belonging to the same process typically share", "The process address space", "Their program counter", "Their register set", "Their stack", "Each thread has its own execution context but shares process resources."],
      ["Scheduling", "Which scheduling policy can cause starvation of long jobs when short jobs continually arrive?", "Shortest job first", "Round robin", "FCFS", "FIFO paging", "SJF favours short jobs and can indefinitely delay a long one."],
      ["Deadlock", "Which is one of the Coffman conditions for deadlock?", "Mutual exclusion", "Infinite memory", "Preemption is mandatory", "No processes", "Deadlock requires mutual exclusion, hold-and-wait, no preemption, and circular wait."],
      ["Paging", "A page fault occurs when", "A referenced page is not in physical memory", "The CPU cache is full", "A file is deleted", "A process exits", "The operating system must fetch a missing virtual-memory page."],
      ["Virtual memory", "The main purpose of virtual memory is to", "Give processes an address space larger than RAM", "Eliminate secondary storage", "Make CPUs faster", "Replace scheduling", "Virtual memory maps virtual addresses to available physical frames and storage."],
      ["File systems", "A directory primarily stores", "Mappings from names to file metadata references", "Only file contents", "CPU registers", "Network routes", "Directories organize names and point to underlying file metadata."],
      ["Synchronization", "What does a mutex provide?", "Mutual exclusion for a critical section", "Disk scheduling", "Message encryption", "Memory compaction", "A mutex lets only one holder enter the protected region at a time."],
      ["Memory management", "External fragmentation is most associated with", "Variable-size contiguous allocation", "Paging with fixed frames", "CPU scheduling", "Spooling", "Variable-sized gaps can accumulate between allocated blocks."],
    ],
    multiple: ["Scheduling", "Which statements about round-robin scheduling are correct?", "It uses a time quantum", "It is designed for time sharing", "It always minimizes turnaround time", "It never performs context switches", "A very small quantum increases context-switch overhead."],
  },
  "Database Management Systems": {
    singles: [
      ["ER model", "In an ER diagram, a relationship represents", "An association among entities", "A database backup", "A compiler error", "A physical disk", "Relationships capture how entity sets are associated."],
      ["Relational algebra", "Which relational algebra operator chooses rows satisfying a condition?", "Selection", "Projection", "Join", "Division", "Selection filters tuples; projection selects attributes."],
      ["SQL", "Which SQL clause filters groups after aggregation?", "HAVING", "WHERE", "ORDER BY", "FROM", "HAVING is evaluated for grouped results."],
      ["Normalization", "A relation in 2NF must first be in", "1NF", "BCNF only", "4NF", "No normal form", "Normal forms build progressively; 2NF includes the conditions of 1NF."],
      ["Transactions", "Which ACID property ensures a transaction is all-or-nothing?", "Atomicity", "Consistency", "Isolation", "Durability", "Atomicity prevents partial transaction effects."],
      ["Indexes", "The usual purpose of a database index is to", "Speed up data retrieval", "Encrypt every row", "Replace constraints", "Store backups", "Indexes supply access paths that can reduce lookup cost."],
      ["Concurrency", "A dirty read means reading", "Data written by an uncommitted transaction", "Only indexed columns", "A database backup", "A locked table after commit", "Dirty data may later be rolled back."],
      ["Recovery", "Write-ahead logging requires log records to be written", "Before the corresponding data pages reach disk", "Only after a checkpoint", "After every SELECT", "Only when a database stops", "WAL ensures enough information exists to recover a change."],
      ["Keys", "A candidate key is", "A minimal set of attributes that uniquely identifies a row", "Any non-unique attribute", "Always a foreign key", "A duplicate index", "Candidate keys uniquely identify tuples with no redundant attribute."],
    ],
    multiple: ["SQL", "Which statements about SQL joins are correct?", "An INNER JOIN returns matched rows", "A LEFT JOIN keeps unmatched rows from its left input", "A CROSS JOIN requires an equality predicate", "A primary key may contain duplicate values", "A CROSS JOIN forms combinations and primary keys are unique."],
  },
  "Computer Networks": {
    singles: [
      ["OSI", "Which OSI layer is responsible for end-to-end transport?", "Transport layer", "Physical layer", "Data link layer", "Presentation layer", "TCP and UDP are transport-layer protocols."],
      ["TCP/IP", "IP primarily provides", "Best-effort packet delivery", "Guaranteed ordered byte streams", "Web page rendering", "File compression", "IP routes datagrams but does not itself guarantee delivery."],
      ["IP addressing", "How many host bits are available in an IPv4 /24 network?", "8", "24", "16", "32", "A /24 reserves 24 of 32 bits for the network prefix."],
      ["Routing", "A router forwards packets mainly using", "A routing table", "A DNS zone", "A browser cache", "A MAC address only", "Routing tables map destination prefixes to next hops."],
      ["TCP", "Which TCP feature establishes a connection?", "Three-way handshake", "ARP reply", "DNS lookup", "Ethernet frame check", "SYN, SYN-ACK, and ACK establish a TCP session."],
      ["UDP", "Which statement best describes UDP?", "It is connectionless and has low protocol overhead", "It guarantees ordered delivery", "It uses a three-way handshake", "It retransmits every loss", "UDP does not provide TCP's reliability mechanisms."],
      ["DNS", "DNS translates", "Domain names to resource records such as IP addresses", "MAC addresses to IP addresses only", "Files to processes", "Packets to frames", "DNS is a distributed naming system."],
      ["HTTP", "Which HTTP method is conventionally used to retrieve a resource?", "GET", "POST", "DELETE", "PATCH", "GET requests a representation without intended state change."],
      ["Security", "TLS is commonly used to provide", "Encrypted and authenticated transport", "IP address allocation", "CPU scheduling", "Database normalization", "TLS protects application data in transit."],
    ],
    multiple: ["Network protocols", "Which statements about TCP are correct?", "It uses sequence numbers", "It supports flow control", "It is an application-layer protocol", "It sends only broadcast packets", "TCP is a reliable transport protocol with sequencing and flow control."],
  },
  "Object-Oriented Programming": {
    singles: [
      ["Classes", "A class is best described as", "A blueprint for objects", "An executed process", "A database table only", "A CPU instruction", "Classes define state and behavior that objects instantiate."],
      ["Objects", "An object combines", "State and behavior", "Only source code", "Only a function call", "Only a database connection", "Objects encapsulate data and operations on that data."],
      ["Inheritance", "Inheritance allows a derived class to", "Reuse and extend a base class", "Delete all parent methods", "Avoid object creation", "Replace compilation", "A subclass derives accessible members and may add or override behavior."],
      ["Polymorphism", "Runtime polymorphism is commonly achieved through", "Method overriding", "Variable renaming", "File inclusion", "Macro expansion only", "Dynamic dispatch selects an overridden implementation at runtime."],
      ["Encapsulation", "Encapsulation primarily helps by", "Restricting direct access to internal state", "Increasing inheritance depth", "Removing all methods", "Making every field public", "Access modifiers preserve object invariants."],
      ["Abstraction", "Abstraction means", "Exposing essential behavior while hiding unnecessary detail", "Copying every implementation detail", "Avoiding all interfaces", "Storing data globally", "Abstraction lets clients focus on what an object does."],
      ["Overloading", "Method overloading means methods have", "The same name with different parameter lists", "Different names and identical parameters", "The same name in unrelated files only", "No return types", "Overloads are resolved using their signatures."],
      ["Overriding", "A valid override in a subclass provides", "A new implementation of an inherited method", "A second constructor only", "A duplicate field", "A database trigger", "Overriding customizes inherited behavior."],
      ["Constructors", "A constructor is called primarily when", "An object is initialized", "A class is deleted", "A method is overloaded", "A package is imported", "Constructors establish a new object's initial state."],
    ],
    multiple: ["Design", "Which statements reflect sound object-oriented design?", "Composition can model a has-a relationship", "Encapsulation can protect invariants", "Every class should expose all fields publicly", "Inheritance always replaces composition", "Composition and controlled access are common design tools."],
  },
  "Software Engineering": {
    singles: [
      ["SDLC", "Which SDLC activity defines what a system must do?", "Requirements engineering", "Deployment only", "Code formatting", "Database backup", "Requirements work elicits, analyzes, and documents needs."],
      ["Waterfall", "The waterfall model is characterized by", "Sequential development phases", "No documentation", "Continuous deployment only", "Random iteration", "Waterfall moves through defined stages with limited overlap."],
      ["Agile", "An Agile sprint is", "A time-boxed development iteration", "A database transaction", "A performance benchmark", "A code compiler", "Teams plan and deliver a usable increment within a sprint."],
      ["Requirements", "A non-functional requirement commonly specifies", "Performance or security constraints", "A single screen's color", "Only a class name", "The source code language", "Non-functional requirements describe quality attributes and constraints."],
      ["Testing", "Unit testing focuses on", "An individual component or function", "The complete deployed organization", "Only user training", "Network cabling", "Unit tests isolate small units of behavior."],
      ["Maintenance", "Corrective maintenance addresses", "Defects discovered after delivery", "New market features only", "Initial requirements", "Team holidays", "Corrective work fixes faults in deployed software."],
      ["Metrics", "Cyclomatic complexity estimates", "The number of independent paths through code", "The size of a hard disk", "Internet bandwidth", "The number of source files", "It is derived from a control-flow graph."],
      ["Risk", "Risk mitigation means", "Reducing the likelihood or impact of a risk", "Ignoring uncertainty", "Guaranteeing no project changes", "Adding more defects", "Mitigation plans reduce exposure before a risk occurs."],
      ["Version control", "A version-control commit records", "A coherent change set in history", "A running production server", "A test result only", "A database lock", "Commits create traceable snapshots of work."],
    ],
    multiple: ["Testing", "Which are levels of software testing?", "Integration testing", "System testing", "Syntax highlighting", "Disk defragmentation", "Integration and system testing validate increasingly broad behavior."],
  },
  "Unix / Shell": {
    singles: [
      ["Commands", "Which command lists directory contents on Unix-like systems?", "ls", "cd", "pwd", "mkdir", "ls displays entries in a directory."],
      ["Shell", "What does the shell primarily do?", "Interprets command lines", "Formats a disk automatically", "Compiles every program", "Replaces the kernel", "The shell is a command interpreter."],
      ["Processes", "Which command commonly displays running processes?", "ps", "cp", "mv", "rm", "ps reports process status."],
      ["Permissions", "What does `chmod` change?", "File permission bits", "A file's owner only", "The process ID", "The current directory", "chmod modifies read, write, and execute modes."],
      ["Files", "Which command copies a file?", "cp", "cat", "touch", "grep", "cp creates a copy of a source file."],
      ["Pipes", "The pipe operator `|` sends", "Standard output of one command to standard input of another", "A file to the recycle bin", "A process to the kernel", "A password to a server", "Pipes compose programs by connecting streams."],
      ["Redirection", "Which symbol redirects standard output and overwrites a file?", ">", ">>", "<", "|", "> writes output to the named file, replacing its contents."],
      ["vi", "Which vi mode is used to enter text?", "Insert mode", "Command mode only", "Kernel mode", "Root mode", "The i command switches vi into insert mode."],
      ["Directories", "What does `pwd` print?", "The current working directory", "The current user's password", "All process IDs", "A file's permissions", "pwd means print working directory."],
    ],
    multiple: ["Permissions", "Which permissions can be represented by Unix file mode bits?", "Read", "Write", "Network routing", "Database indexing", "Unix modes include read, write, and execute permissions."],
  },
  "Introduction to Computers": {
    singles: [
      ["CPU", "Which CPU component performs arithmetic and logical operations?", "ALU", "RAM", "SSD", "NIC", "The arithmetic logic unit carries out calculations and Boolean operations."],
      ["Memory", "Which memory is volatile?", "RAM", "ROM", "SSD", "Optical disc", "RAM loses its contents without power."],
      ["I/O", "A keyboard is an example of an", "Input device", "Output device", "Storage-only device", "CPU register", "A keyboard sends data into the computer."],
      ["Number systems", "What is decimal 10 in binary?", "1010", "1001", "1100", "1110", "10 = 8 + 2, so its binary form is 1010."],
      ["Boolean logic", "What is the result of `1 AND 0`?", "0", "1", "Undefined", "2", "AND is true only if both operands are true."],
      ["Architecture", "The instruction register holds", "The instruction currently being decoded or executed", "Every program in memory", "Only user input", "A hard disk sector", "The CPU fetch-decode-execute cycle uses the instruction register."],
      ["Storage", "Which is typically secondary storage?", "Solid-state drive", "CPU cache", "Register", "RAM", "SSDs retain data independently of main memory."],
      ["Operating systems", "The operating system manages", "Hardware resources and program execution", "Only word processing", "Only internet browsing", "Only source control", "An OS coordinates processes, memory, devices, and files."],
      ["Networking", "A network interface card is used to", "Connect a computer to a network", "Store BIOS settings", "Compile source code", "Perform arithmetic", "A NIC implements a network connection."],
    ],
    multiple: ["Memory hierarchy", "Which statements about memory hierarchy are correct?", "Registers are very fast", "Main memory is typically larger than registers", "Hard disks are CPU registers", "All storage has identical latency", "Fast small memories sit closer to the CPU than large storage."],
  },
  "Machine Learning": {
    singles: [
      ["Classification", "Classification predicts", "A discrete class label", "Only a continuous number", "A database schema", "A network cable", "Classification assigns examples to categories."],
      ["Regression", "Linear regression is generally used to predict", "A continuous numeric value", "A categorical label only", "A SQL query", "A graph traversal", "Regression models target numeric quantities."],
      ["Decision trees", "A decision tree split aims to", "Separate examples into purer groups", "Increase every feature value", "Eliminate all data", "Encrypt labels", "Splits choose tests that improve class or target homogeneity."],
      ["SVM", "A support vector machine seeks a decision boundary with", "Maximum margin", "Maximum file size", "Zero training examples", "No features", "The maximum-margin hyperplane separates classes robustly."],
      ["Clustering", "Clustering is usually a", "Unsupervised learning task", "Guaranteed supervised task", "Database transaction", "Sorting algorithm only", "Clustering finds structure without given target labels."],
      ["Neural networks", "An activation function introduces", "Non-linearity", "A database index", "A file system", "A network protocol", "Non-linear activations let neural networks model complex functions."],
      ["Bayesian learning", "Bayes' theorem relates", "Conditional probabilities", "Only Euclidean distances", "CPU instructions", "SQL joins", "Bayes' theorem updates beliefs using evidence."],
      ["Evaluation", "Overfitting occurs when a model", "Fits training data well but generalizes poorly", "Cannot learn any training pattern", "Has no parameters", "Always improves validation results", "An overfit model learns noise or overly specific patterns."],
      ["Features", "Feature scaling is often useful for", "Distance-based algorithms such as k-nearest neighbours", "Only text editors", "File compression", "Operating-system booting", "Distances can be dominated by features with larger numerical ranges."],
    ],
    multiple: ["Evaluation", "Which statements about a held-out test set are correct?", "It estimates generalization after model selection", "It should not guide repeated tuning decisions", "It is the same as every training batch", "It guarantees a perfect model", "Keeping test data separate provides a less biased final evaluation."],
  },
};

function rotate<T>(items: T[], amount: number): T[] {
  return items.map((_, index) => items[(index - amount + items.length) % items.length]);
}

function optionsFor(items: string[], position: number) {
  return rotate(items, position).map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
}

function difficulty(index: number): Difficulty {
  return index % 5 === 0 ? "Hard" : index % 2 === 0 ? "Easy" : "Medium";
}

export const markingDefaults = {
  singlePositive: 1,
  singleNegative: 0.25,
  multiplePositive: 2,
  multiplePartial: 1,
  multipleNegative: 0.5,
  multipleNegativeEnabled: true,
};

export const supportedSubjects = Object.keys(bank);

export const questionBank: Question[] = Object.entries(bank).flatMap(([subject, group], subjectIndex) => {
  const singleQuestions = group.singles.map((spec, index) => {
    const [topic, questionText, correct, ...rest] = spec;
    const last = rest.pop()!;
    const optionTexts = optionsFor([correct, ...rest], (subjectIndex + index) % 4);
    return {
      id: `practice-${subjectIndex + 1}-${index + 1}`,
      questionText,
      questionType: "SINGLE" as QuestionType,
      category: "CATEGORY_1" as const,
      subject,
      topic,
      difficulty: difficulty(index),
      options: optionTexts,
      correctAnswers: [optionTexts.find((option) => option.text === correct)!.id],
      explanation: last,
      marks: 1,
      negativeMarks: 0.25,
      source: "JECA Prep Hub original practice question bank",
      sourceType: "PRACTICE" as const,
      tags: [topic.toLowerCase(), subject.toLowerCase()],
    };
  });
  const [topic, questionText, correct1, correct2, wrong1, wrong2, explanation] = group.multiple;
  const optionTexts = optionsFor([correct1, correct2, wrong1, wrong2], subjectIndex % 4);
  const multipleQuestion: Question = {
    id: `practice-${subjectIndex + 1}-10`,
    questionText,
    questionType: "MULTIPLE",
    category: "CATEGORY_2",
    subject,
    topic,
    difficulty: "Medium",
    options: optionTexts,
    correctAnswers: optionTexts.filter((option) => option.text === correct1 || option.text === correct2).map((option) => option.id),
    explanation,
    marks: 2,
    negativeMarks: 0.5,
    source: "JECA Prep Hub original practice question bank",
    sourceType: "PRACTICE",
    tags: [topic.toLowerCase(), "multiple-correct"],
  };
  const bonus: Question = {
    ...singleQuestions[0],
    id: `practice-${subjectIndex + 1}-11`,
    questionText: `Concept check — ${singleQuestions[0].questionText}`,
    difficulty: "Hard",
    tags: [...singleQuestions[0].tags, "revision"],
  };
  return [...singleQuestions, multipleQuestion, bonus];
});

export function publicQuestion(question: Question) {
  const { correctAnswers, explanation, ...visible } = question;
  return visible;
}

export const officialPaperReferences = [2025, 2024, 2023, 2022, 2021, 2019, 2018, 2017].map((year) => ({
  year,
  title: `WB JECA ${year} question paper`,
  source: "WBJEEB official archive / published paper",
  status: "Reference only — not reproduced in this demo until verified against the official paper and answer key.",
}));
