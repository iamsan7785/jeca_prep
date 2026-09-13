import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const rawText = `============================================================
JECA 2025 OFFICIAL PYQ — COMPLETE REPLACEMENT DATASET
============================================================

IMPORTANT:
Replace the existing WRONG/INCOMPLETE JECA 2025 PYQ dataset.

The official uploaded JECA 2025 question paper is the primary
source of truth.

The official paper contains EXACTLY 100 questions:
- Q1–Q80: Category-1, 1 mark, one correct option
- Q81–Q100: Category-2, 2 marks, one or more correct options

DO NOT keep the old incorrect 2025 questions.
DO NOT merge old and new questions.
DELETE/REPLACE the old JECA 2025 question records.
DO NOT modify JECA 2022, 2023 or 2024.

The following is the verified replacement dataset.

============================================================
CATEGORY 1 — QUESTIONS 1–80
============================================================

Q1.
Which of the following types of memory is non-volatile?

A) RAM
B) Cache
C) Register
D) EPROM

ANSWER: D


Q2.
Which of the following statements about RAM is correct?

A) Type of non-volatile memory used for permanent data storage.
B) Retains data even when the power is turned off.
C) Volatile memory used for temporary storage during program execution.
D) Can only be read but not written to.

ANSWER: C


Q3.
Which of the following best distinguishes a sequential circuit from a combinational circuit?

A) Sequential circuits produce output based only on current inputs.
B) Sequential circuits use both current inputs and past states to determine output.
C) Combinational circuits have memory elements to store past states.
D) Combinational circuits require a clock signal to operate.

ANSWER: B


Q4.
A system has a 16-bit data bus and a 20-bit address bus. What is the maximum amount of data (in bytes) the system can directly address in memory?

A) 2^20 bytes = 1 MB
B) 2^16 bytes = 64 KB
C) 2^20 words = 2 MB
D) 2^36 bytes = 64 GB

ANSWER: A


Q5.
1 nibble = ______ bits

A) 2 bits
B) 4 bits
C) 8 bits
D) 16 bits

ANSWER: B


Q6.
Which of the following is not a type of computer code?

A) EDIC
B) ASCII
C) BCD
D) EBCDIC

ANSWER: A


Q7.
What is the range of unsigned int in C?

A) -32,768 to +32,767
B) 1 to +32,767
C) 0 to 65535
D) 1 to 65536

ANSWER: C


Q8.
What will be output of the following code snippet?

#include <stdio.h>

int main() {
    float x = 5;

    if(x > 10)
        printf("Greater");
    else if(x = 10)
        printf("Equal");
    else
        printf("Smaller");

    return 0;
}

A) Greater
B) Equal
C) Smaller
D) No output

ANSWER: B


Q9.
What will be output of the following code snippet?

#include <stdio.h>

int main() {
    int i;

    for(i=1; i<=5; i++) {
        if(i == i)
            continue;

        printf("%d ", i);
    }

    return 0;
}

A) 12345
B) 2345
C) 1234
D) No output

ANSWER: D


Q10.
Which of the following statements about arrays in C is correct?

A) Array indices in C start from 1.
B) The size of an array must always be specified at runtime.
C) An array name in C represents the address of the first element.
D) Arrays in C can store elements of different data types.

ANSWER: C


Q11.
Read the following statements about functions in C and choose the correct option:

(i) A function in C can return only one value directly.
(ii) Function names can be the same as variable names in the same scope.
(iii) A function must always take at least one argument.
(iv) Recursion is allowed in C functions.

A) All statements are correct.
B) Only statements (i) and (iv) are correct.
C) Only statements (ii) and (iii) are correct.
D) None of the statements are correct.

ANSWER: B


Q12.
What happens when a recursive function in C lacks a proper base condition?

A) The function executes only once and terminates.
B) The compiler shows a syntax error.
C) It leads to infinite recursion and eventually a stack overflow.
D) The function automatically converts to an iterative form.

ANSWER: C


Q13.
What will be the output of the following C code?

#include <stdio.h>

int main() {
    int a = 10;
    int *p = &a;
    printf("%d\n", *p);
    return 0;
}

A) Address of the variable a
B) Garbage value
C) Compilation error
D) 10

ANSWER: D


Q14.
A risk in a software project has a probability of occurrence of 0.3 and the potential loss if it occurs is estimated to be Rs 2,00,000. What is the Risk Exposure (RE) for this risk?

A) Rs 60,000
B) Rs 2,00,000
C) Rs 6,000
D) Rs 66,666

ANSWER: A


Q15.
Which metric gives the best measure of efficiency in a defect discovery process across software development phases?

A) Defect Density
B) Cyclomatic Complexity
C) Defect Removal Efficiency (DRE)
D) Mean Time to Failure (MTTF)

ANSWER: C


Q16.
Which testing approach specifically ensures that all logical conditions in a decision are tested at least once?

A) Statement Coverage
B) Branch Coverage
C) Path Coverage
D) Condition Coverage

ANSWER: D


Q17.
Which of the following pairs correctly matches the type of testing with its main focus or environment?

A) White Box — End-user feedback
B) Alpha Testing — Developer site
C) Beta Testing — Internal logic testing
D) Black Box — Code coverage analysis

ANSWER: B


Q18.
Which of the following statements about structures and unions in C is true?

A) In a structure, all members share the same memory location.
B) In a union, all members have separate memory locations.
C) The size of a union is equal to the size of its largest member.
D) The size of a structure is always equal to the sum of the sizes of its members, without any padding.

ANSWER: C


Q19.
What will be the output of the following program?

#include <stdio.h>
#include <string.h>

int main() {
    char str1[20] = "Hello ";
    char str2[20] = "Hello";

    strcpy(str2, str1);

    if(strcmp(str1, str2) == 0)
        printf("Equal\n");
    else
        printf("Not Equal\n");

    return 0;
}

A) Equal
B) Not Equal
C) Compiler Error
D) Undefined Behavior

ANSWER: A


Q20.
In the context of software quality management, which of the following focuses on preventing defects rather than detecting them?

A) Quality Control
B) Quality Assurance
C) Software Testing
D) Debugging

ANSWER: B


Q21.
Which of the following options with grep is used to ignore case while searching?

A) -n
B) -i
C) -r
D) -c

ANSWER: B


Q22.
Which of the following is not a typical use of stacks?

A) Expression evaluation
B) Undo mechanism in editors
C) Recursion function call management
D) Breadth-first search traversal

ANSWER: D


Q23.
In a circular queue of size n, when is the queue considered full?

A) Front == Rear
B) (Rear + 1) % n == Front
C) Rear == n
D) Front == 0

ANSWER: B


Q24.
Which of the following traversal techniques lists the nodes of a binary search tree in ascending order?

A) Inorder
B) Preorder
C) Postorder
D) None of these

ANSWER: A


Q25.
The running time T(n) of an algorithm for n input is given as follows:

T(n) = c + T(n-1), if n > 1
     = d, if n <= 1

Here c and d are constant.

A) n^2
B) n
C) n^3
D) n^n

ANSWER: B


Q26.
The order of an algorithm that finds whether a given Boolean function of n variables produces 1 is

A) constant
B) linear
C) logarithmic
D) exponential

ANSWER: D


Q27.
Which of the following can be done with Linked List?

A) Implementation of Stacks and Queues
B) Implementation of Binary Trees
C) Implementation of Data Structures that can simulate Dynamic Arrays
D) All of the above

ANSWER: D


Q28.
What is the worst case time complexity to access an element in a binary search tree?

A) O(n)
B) O(n * log n)
C) O(1)
D) O(log n)

ANSWER: A


Q29.
Packet switching means:

A) Sending data as a continuous bit stream
B) Using fixed data circuits for each transmission
C) Dividing data into packets and sending independently
D) Switching physical cables between transmissions

ANSWER: C


Q30.
Which of the following represents postorder traversal of a binary tree?

A) Root → Left → Right
B) Left → Root → Right
C) Left → Right → Root
D) Right → Left → Root

ANSWER: C


Q31.
In a graph of n nodes and n edges, how many cycles will be present?

A) Exactly 1
B) At most 1
C) At most 2
D) Depends on the graph

ANSWER: B


Q32.
What is the value of the postfix expression 6 3 2 4 + - *?

A) -18
B) 18
C) 22
D) 40

ANSWER: A


Q33.
Which of the following points is/are not true about Linked List data structure when it is compared with an array?

A) Random access is not allowed in a typical implementation of Linked Lists.
B) Access of elements in Linked List takes less time than compared to arrays.
C) Arrays have better cache locality that can make them better in terms of performance.
D) It is easy to insert and delete elements in Linked List.

ANSWER: B


Q34.
What is a dequeue?

A) A queue implemented with both singly and doubly Linked Lists
B) A queue with insert/delete defined for front side of the queue
C) A queue with insert/delete defined for both front and rear ends of the queue
D) A queue implemented with a doubly Linked List

ANSWER: C


Q35.
What is the best case time complexity of deleting a node in a Singly Linked List?

A) O(n)
B) O(log n)
C) O(n log n)
D) O(1)

ANSWER: D


Q36.
Which of the following is the correct sequence of stages in a basic instruction pipeline?

A) Fetch → Decode → Execute
B) Decode → Fetch → Execute
C) Execute → Decode → Fetch
D) Fetch → Execute → Decode

ANSWER: A


Q37.
________ contains firmware that boots the system.

A) ROM
B) RAM
C) Cache
D) DMA controller

ANSWER: A


Q38.
Which of the following is not a valid characteristic of SRAM?

A) Faster than DRAM
B) Expensive
C) Volatile
D) Requires frequent refreshing

ANSWER: D


Q39.
The sequence of events that happen during a typical fetch operation is

A) PC → MAR → Memory → MDR → IR
B) PC → Memory → MDR → IR
C) PC → Memory → IR
D) PC → MAR → Memory → IR

ANSWER: A


Q40.
How many 2-input multiplexers are required to construct a 2^10-multiplexer?

A) 1023
B) 31
C) 10
D) 127

ANSWER: A


Q41.
Which one is not a part of Process Control Block (PCB)?

A) Process state
B) Program counter
C) CPU registers
D) Source code of the program

ANSWER: D


Q42.
In the process lifecycle, the queue where processes wait for CPU allocation is called the ______ queue.

A) Ready
B) Waiting
C) Job
D) Device

ANSWER: A


Q43.
In an operating system, a thread is best described as

A) A program in execution.
B) The smallest unit of CPU scheduling.
C) A process that has finished execution.
D) A collection of processes.

ANSWER: B


Q44.
Which of the following scheduling algorithms can work in both preemptive and non-preemptive modes?

A) First-Come, First-Served (FCFS)
B) Shortest Job First (SJF)
C) Priority Scheduling
D) Round Robin (RR)

ANSWER: C


Q45.
Which of the following is a deadlock avoidance algorithm?

A) First-Come, First-Served (FCFS)
B) Banker’s Algorithm
C) Round Robin (RR)
D) Shortest Remaining Time First (SRTF)

ANSWER: B


Q46.
Which type of fragmentation occurs inside allocated memory blocks?

A) Internal fragmentation
B) External fragmentation
C) Paging fragmentation
D) Compaction fragmentation

ANSWER: A


Q47.
Which of the following statements is true about paging and fragmentation?

A) Paging suffers from internal fragmentation but not external fragmentation.
B) Paging suffers from external fragmentation but not internal fragmentation.
C) Paging suffers from both internal and external fragmentation.
D) Paging does not suffer from any kind of fragmentation.

ANSWER: A


Q48.
Which command is used to find the number of lines, words and characters in a file in Unix?

A) count
B) wc
C) nl
D) cat

ANSWER: B


Q49.
Which Unix command will change the group ownership of the file report.txt to the group staff?

A) chmod staff report.txt
B) chown staff report.txt
C) groupadd staff report.txt
D) chgrp staff report.txt

ANSWER: D


Q50.
In Unix, user wants to change the priority of a running process, which is the suitable command?

A) nice
B) ps
C) renice
D) kill

ANSWER: C


Q51.
In the OSI model, which layer is responsible for detecting errors caused during physical transmission?

A) Physical Layer
B) Transport Layer
C) Data Link Layer
D) Session Layer

ANSWER: C


Q52.
In the TCP/IP model, ______ is responsible for determining the best path for data packets to travel across interconnected networks.

A) Application Layer
B) Transport Layer
C) Internet Layer
D) Network Access Layer

ANSWER: C


Q53.
Which type of routing automatically changes its path selection based on current network conditions like congestion or link failures?

A) Static Routing
B) Default Routing
C) Dynamic Routing
D) Adaptive Routing

ANSWER: D


Q54.
Which of the following protocols is connectionless and provides unreliable data delivery?

A) TCP
B) IP
C) UDP
D) Both (B) and (C)

ANSWER: D


Q55.
Which field in the IPv4 header helps uniquely identify fragments of a datagram so they can be reassembled correctly?

A) Identification
B) Time to Live (TTL)
C) Protocol
D) Flags

ANSWER: A


Q56.
The IP address 10.5.6.7 belongs to which class?

A) Class A
B) Class B
C) Class C
D) Class D

ANSWER: A


Q57.
Which application layer protocol is primarily used for sending email?

A) IMAP
B) POP3
C) SMTP
D) FTP

ANSWER: C


Q58.
What does a firewall primarily do?

A) Encrypts data
B) Filters network traffic
C) Detects viruses
D) Manages network routing

ANSWER: B


Q59.
Which attack involves intercepting and altering communication between two parties without their knowledge?

A) Phishing
B) Man-in-the-Middle Attack
C) Denial of Service (DoS)
D) Spoofing

ANSWER: B


Q60.
Which device is used to connect multiple devices within the same network segment and operates at the data link layer?

A) Router
B) Gateway
C) Switch
D) Modem

ANSWER: C


Q61.
The physical relationship of record is determined by a mathematical formula that transforms a file key into a record location in

A) a B-tree file.
B) an indexed file.
C) a hashed file.
D) a sequential file.

ANSWER: C


Q62.
A data dictionary is a special file that contains

A) The names of all fields in all files.
B) The data types of all fields in all files.
C) The width of all fields in all files.
D) All of these

ANSWER: D


Q63.
A functional dependency of the form X → Y is trivial if

A) Y ⊆ X
B) Y ⊂ X
C) X ⊆ Y
D) X ⊂ Y and Y ⊂ X

ANSWER: A


Q64.
There is a possibility of a cascading rollback when

A) A transaction writes items that have been written only by a committed transaction.
B) A transaction writes items that is previously written by an uncommitted transaction.
C) A transaction reads an items that is previously written by an uncommitted transaction.
D) Both (B) and (C)

ANSWER: D


Q65.
In an entity relationship, y is the dominant entity and x is a subordinate entity. Then which one is incorrect?

A) Operationally, if y is deleted, so is x.
B) x is existence dependent on y.
C) Operationally, if x is deleted, so is y.
D) Operationally, if x is deleted, y remains same.

ANSWER: C


Q66.
Choose the correct statement:

A) An alternate key is a candidate key, that is not a primary key.
B) An alternate key is a primary key, that is not a candidate key.
C) An alternate key is a candidate key, that is also a primary key.
D) None of the above

ANSWER: A


Q67.
If one attribute is a determinant of a second, which in turn is a determinant of a third, then the relation cannot be

A) well-structured.
B) in 1NF.
C) in 2NF.
D) in 3NF.

ANSWER: D


Q68.
Which of the following statements regarding relational algebra are true?

(i) R ⋈ S = σ(R × S)
(ii) R ⋈ S = Π(R × S)
(iii) R ⋈ S = R * S

A) Only (i).
B) Only (ii).
C) Only (iii).
D) None of these

ANSWER: A


Q69.
Which process model is best suited when requirements are well understood and unlikely to change?

A) Incremental Model
B) Waterfall Model
C) Spiral Model
D) Agile Model

ANSWER: B


Q70.
Which testing strategy is performed without knowledge of the internal code?

A) Black-box Testing
B) Unit Testing
C) Structural Testing
D) White-box Testing

ANSWER: A


Q71.
Which design principle aims to reduce dependencies between modules?

A) Cohesion
B) Coupling
C) Modularity
D) Abstraction

ANSWER: B


Q72.
Correct sequence of Risk Management process is

A) Identification → Assessment → Prioritization → Mitigation → Monitoring → Documentation.
B) Assessment → Identification → Prioritization → Mitigation → Monitoring → Documentation.
C) Identification → Assessment → Mitigation → Prioritization → Monitoring → Documentation.
D) Identification → Mitigation → Assessment → Prioritization → Monitoring → Documentation.

ANSWER: A


Q73.
Which of the following testing methods is normally used as the acceptance test for a software system?

A) Regression testing
B) Integration testing
C) Unit testing
D) Functional testing

ANSWER: D


Q74.
Which of the following is not a supervised machine learning algorithm?

A) K-means
B) Naive Bayes
C) SVM for classification problems
D) Decision tree

ANSWER: A


Q75.
What is the key benefit of using deep learning for tasks like recognizing images?

A) They need less training data than other methods.
B) They’re easier to explain and understand than other models.
C) They can learn complex details from the data on their own.
D) They work faster and are more efficient computationally.

ANSWER: C


Q76.
What is the key difference between supervised and unsupervised learning?

A) Supervised learning requires labeled data, while unsupervised learning does not.
B) Supervised learning predicts labels, while unsupervised learning discovers patterns.
C) Supervised learning is used for classification, while unsupervised learning is used for regression.
D) Supervised learning is always more accurate than unsupervised learning.

ANSWER: A


Q77.
The purpose of an activation function in a neural network is to

A) Initialize weights
B) Add non-linearity
C) Normalize input
D) Optimize gradients

ANSWER: B


Q78.
Hidden Markov Models assume the system is

A) Deterministic
B) Linear
C) Stochastic
D) Static

ANSWER: C


Q79.
In SVMs, the margin is defined as

A) The perpendicular distance from the decision boundary to the closest support vector.
B) The Euclidean distance between the two farthest data points in the dataset.
C) The difference in predicted probabilities between the two classes.
D) The perpendicular distance from any point to the hyperplane along the normal vector.

ANSWER: A


Q80.
An artificially intelligent car decreases its speed based on its distance from the car in front of it. Which algorithm is used?

A) Naive-Bayes
B) Decision Tree
C) Linear Regression
D) Logistic Regression

ANSWER: C


============================================================
CATEGORY 2 — QUESTIONS 81–100
============================================================

IMPORTANT:
These are 2-mark questions.

ONE OR MORE OPTIONS MAY BE CORRECT.

Store answers as an array:
correctOptions: ["A"]
or:
correctOptions: ["A", "C"]

DO NOT force Category-2 into a single-answer field.


Q81.
What will be the output of the following C program?

#include <stdio.h>

int recur(int n) {
    if(n == 0)
        return 0;
    else
        return n + recur(n - 1);
}

int main() {
    int result = recur(4);
    printf("%d\n", result);
    return 0;
}

A) 10
B) 6
C) 4
D) 0

CORRECT OPTIONS: ["A"]


Q82.
A software module contains 1500 lines of code and 15 defects were found during testing. What is the defect density of the module?

A) 0.01 defects per KLOC
B) 1 defect per KLOC
C) 10 defects per KLOC
D) 100 defects per KLOC

CORRECT OPTIONS: ["C"]


Q83.
A development team found 90 defects during the design phase of a project. However, 10 additional design defects were discovered during the testing phase. What is the Defect Removal Efficiency (DRE) for the design phase?

A) 10%
B) 90%
C) 80%
D) 95%

CORRECT OPTIONS: ["B"]


Q84.
What will be the output of the following C code?

#include <stdio.h>

int main() {
    int x;
    x = 4<3 ? 100 : 3==3 ? 2 ? 50 : 75;
    printf("%d", x);
    return 0;
}

A) Compilation Error
B) 100
C) 50
D) 75

CORRECT OPTIONS: ["C"]


Q85.
Five elements P, Q, R, S, T are pushed onto a stack starting from P. The stack is then popped 4 times, and each popped element is inserted into a queue. Two elements are then deleted from the queue and pushed back onto the stack. Finally, one element is popped from the stack. What will be the popped element?

A) P
B) Q
C) R
D) S

CORRECT OPTIONS: ["B"]


Q86.
Consider the following operations on a singly linked list initially containing the elements:

10 → 20 → 30 → 40

(i) Insert 15 after 10.
(ii) Delete the node containing 30.
(iii) Insert 25 at the end of the list.
(iv) Delete the first node.

What will be the final sequence of elements in the linked list?

A) 15 → 20 → 25 → 40
B) 20 → 15 → 40 → 25
C) 15 → 20 → 40 → 25
D) 20 → 15 → 25 → 40

CORRECT OPTIONS: ["D"]


Q87.
A complete binary tree has 63 nodes. How many leaf nodes does it have?

A) 16
B) 32
C) 42
D) 48

CORRECT OPTIONS: ["B"]


Q88.
Find the output from the following C++ code snippet:

class A {
public:
    void show() {
        cout << "Class A\n";
    }
};

class B : public A {
public:
    void show() {
        A::show();
        cout << "Class B";
    }
};

int main() {
    B obj;
    obj.show();
    return 0;
}

A) Class A
B) Class B
C) Program will be in infinite loop
D) Compilation error

CORRECT OPTION: ["B"]

NOTE:
The actual output is "Class A" followed by "Class B".
The answer option is B according to the paper's choices.


Q89.
What will be the output of this program?

#include <iostream>
using namespace std;

class Test {
public:
    static int x;

    Test() {
        x++;
    }

    void display() {
        cout << x << " ";
    }
};

int Test::x = 5;

int main() {
    Test t1;
    t1.display();

    Test t2;
    t2.display();

    return 0;
}

A) 6 7
B) 6 6
C) 7 7
D) 5 5

CORRECT OPTIONS: ["A"]


Q90.
What is the output of the following C++ code?

#include <iostream>
using namespace std;

class Base {
public:
    virtual void show() {
        cout << "Base";
    }
};

class Derived : public Base {
public:
    void show() override {
        cout << "Derived";
    }
};

int main() {
    Base* ptr;
    Derived d;
    ptr = &d;
    ptr->show();
    return 0;
}

A) Compilation error
B) Base
C) Derived
D) Runtime error

CORRECT OPTIONS: ["C"]


Q91.
Which of the following are true about cyclomatic complexity?

A) It measures the number of independent paths in a program.
B) It measures the size of the program in lines of code.
C) Higher Values indicate simpler code.
D) It is calculated as E − N + 2, where E is edges and N is nodes.

CORRECT OPTIONS: ["A", "D"]


Q92.
A testing phase executes 180 test cases out of 200 planned, with 162 passes and 18 failures. Which are true?

A) Test execution coverage = 90%
B) Test pass rate = 90%
C) Requirement coverage = 85%
D) All of these

CORRECT OPTIONS: ["D"]

NOTE:
D represents "All of these".


Q93.
In the context of Software Development Life Cycle (SDLC), which of the following statements is correct?

A) The Spiral model focuses only on risk identification and not on risk mitigation.
B) The Incremental model delivers the complete product only at the final iteration.
C) In the Waterfall model, requirements can be changed at any phase without impact.
D) The V-Model integrates testing activities corresponding to each development phase.

CORRECT OPTIONS: ["D"]


Q94.
The number of cross point needed for 10 lines cross point switch in full duplex in nature and there are no self connection is

A) 45
B) 100
C) 50
D) 20

CORRECT OPTIONS: ["A"]


Q95.
Maximum data rate of a channel for noiseless 3 KHz binary channel is

A) 3000 bps
B) 6000 bps
C) 1500 bps
D) None of these

CORRECT OPTIONS: ["B"]


Q96.
A computer with 32 bit wide data bus uses 4K × 8 static RAM memory chips. The smallest memory of this computer is

A) 32 KB
B) 16 KB
C) 8 KB
D) 24 KB

CORRECT OPTIONS: ["B"]


Q97.
A machine needs a minimum of 100 second to sort 1000 names by quick sort. The minimum time needed to sort 100 names will be approximately

A) 6.7 second
B) 10 second
C) 11.2 second
D) 50.2 second

CORRECT OPTIONS: ["A"]


Q98.
Choose the correct answer:

If X is a Boolean variable then

A) 0 + X = X
B) 1 + X = X
C) X + X = X
D) None of these

CORRECT OPTIONS: ["A", "C"]


Q99.
Which of following units can be used to measure the speed of a computer?

A) SYPS
B) MIPS
C) BAUD
D) FLOPS

CORRECT OPTIONS: ["B", "D"]


Q100.
Which of the following are advantages of using a linked list over arrays?

A) Dynamic size allocation
B) Faster random access
C) Easier insertion and deletion
D) All of these

CORRECT OPTIONS: ["A", "C"]


============================================================
DATABASE REPLACEMENT REQUIREMENTS
============================================================

1. Find the existing JECA 2025 PyqPaper.

2. Delete/replace ONLY its old PyqQuestion records.

3. Insert the complete 100-question dataset above.

4. Do not append the new records to the old records.

5. Do not modify:
   - JECA 2022
   - JECA 2023
   - JECA 2024
   - practice questions
   - mock tests
   - users
   - unrelated attempts

6. Preserve:
   year = 2025
   title = JECA 2025
   original question numbers = 1–100

7. Preserve original question order.

8. Do NOT randomize PYQ questions.

9. Do NOT hard-code a lower number such as 70, 74, 75 or 95.

10. The JECA 2025 exam MUST contain all 100 questions.

============================================================
ANSWER STORAGE
============================================================

Category-1:

correctOption:
"A"

Category-2:

correctOptions:
["A"]
or:
["A", "C"]

If the existing schema only supports one answer field,
modify it safely so Category-2 can support multiple correct
options.

Do not incorrectly convert multi-answer questions into
single-answer questions.

============================================================
PYQ PLAYABILITY
============================================================

JECA 2025 must now be playable.

The old rule:

"no official answer key = unavailable"

must NOT prevent the exam from starting.

Use the supplied answers for scoring.

However, distinguish:

answerSource = "VERIFIED"

from:

answerSource = "OFFICIAL"

Do NOT claim that an AI/solution-derived answer is an official
WBJEEB answer unless the official answer key has been verified.

If an official WBJEEB final answer key is available in the
project, compare it against this dataset and use the official
key where appropriate.

============================================================
IMPORTANT VALIDATION
============================================================

After importing, run these checks:

EXPECTED TOTAL:
100

CATEGORY 1:
80 questions

CATEGORY 2:
20 questions

TOTAL:
100 questions

Check:

- Q1 exists
- Q2 exists
- ...
- Q100 exists
- no missing question numbers
- no duplicate question numbers
- no duplicate records
- every question has questionText
- every question has its options
- every Category-1 question has exactly one correct option
- every Category-2 question supports one or more correct options
- question order is 1 → 100

Database verification must report:

Total JECA 2025 questions: 100
Category-1 questions: 80
Category-2 questions: 20
Missing questions: 0
Duplicate questions: 0

============================================================
FRONTEND REQUIREMENT
============================================================

PYQ LIBRARY should show:

JECA 2025
100 Questions
120 Minutes
Available
Give Exam

When the user clicks "Give Exam":

Q1 → Q2 → Q3 → ... → Q100

ALL 100 questions must be available.

Do not display only the first 70/74/75/95 questions.

Do not truncate the question list.

Do not randomly shuffle the official PYQ.

============================================================
FINAL TEST
============================================================

Start a JECA 2025 PYQ exam.

Verify:

- Q1 loads
- Q10 loads
- Q20 loads
- Q30 loads
- Q40 loads
- Q50 loads
- Q60 loads
- Q70 loads
- Q80 loads
- Q81 loads
- Q90 loads
- Q100 loads

Verify that every question between Q1 and Q100 is available.

Submit the complete exam.

Verify scoring.

Verify question-wise review.

Verify correct answer display.

Verify Category-2 multiple-answer scoring.

============================================================
CRITICAL RULE
============================================================

THIS IS A REPLACEMENT, NOT AN APPEND.

DELETE THE OLD WRONG JECA 2025 QUESTIONS.

IMPORT THE COMPLETE 100 OFFICIAL QUESTIONS.

KEEP THE ORIGINAL QUESTION TEXT AND OPTIONS.

KEEP THE ORIGINAL QUESTION NUMBER.

KEEP THE ORIGINAL ORDER.

DO NOT INVENT QUESTIONS.

DO NOT REMOVE QUESTIONS.

DO NOT STOP AT 70, 74, 75 OR 95.

THE FINAL JECA 2025 DATASET MUST CONTAIN EXACTLY 100 QUESTIONS.
============================================================`;

function parseQuestionBlocks(text: string) {
  const lines = text.split(/\r?\n/);
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^Q\d+\./.test(line.trim())) {
      if (current.length) blocks.push(current);
      current = [line];
    } else if (current.length) {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);

  return blocks;
}

function extractAnswer(line: string): string[] | null {
  const normalized = line.trim();
  const direct = normalized.match(/^ANSWER:\s*(.+)$/i);
  if (direct) {
    const value = direct[1].trim();
    if (/^[A-D]$/i.test(value)) return [value.toUpperCase()];
    return null;
  }

  const directSet = normalized.match(/^CORRECT OPTION:\s*(.+)$/i);
  if (directSet) {
    const raw = directSet[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).toUpperCase());
      if (typeof parsed === 'string') return [parsed.toUpperCase()];
    } catch {
      // ignore
    }
    return [raw.replace(/[^A-D]/gi, '').toUpperCase()];
  }

  const multi = normalized.match(/^CORRECT OPTIONS:\s*(.+)$/i);
  if (multi) {
    const raw = multi[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).toUpperCase());
      if (typeof parsed === 'string') return [parsed.toUpperCase()];
    } catch {
      // ignore
    }
    const cleaned = raw.replace(/[^A-D,\[\]"'\s]/g, '');
    try {
      const parsed = JSON.parse(cleaned.replace(/'/g, '"'));
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).toUpperCase());
    } catch {
      // ignore
    }
    return raw.split(/[,\[\]]/).map((value) => value.trim()).filter(Boolean).map((value) => value.toUpperCase());
  }

  return null;
}

function parseQuestionBlock(block: string[]) {
  const first = block[0]?.trim();
  const m = first.match(/^Q(\d+)\./i);
  if (!m) return null;
  const questionNumber = Number(m[1]);

  const lines = block.slice(1);
  const questionParts: string[] = [];
  const options: Record<'A' | 'B' | 'C' | 'D', string> = { A: '', B: '', C: '', D: '' };
  let currentOption: keyof typeof options | null = null;
  let answer: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const optionMatch = line.match(/^([A-D])\)\s*(.*)$/i);
    if (optionMatch) {
      const key = optionMatch[1].toUpperCase() as keyof typeof options;
      currentOption = key;
      options[key] = optionMatch[2].trim();
      continue;
    }

    const extracted = extractAnswer(line);
    if (extracted) {
      answer = extracted;
      break;
    }

    if (currentOption) {
      options[currentOption] += ` ${line}`.trim();
    } else {
      questionParts.push(line);
    }
  }

  if (!answer) {
    return null;
  }

  const questionText = questionParts.join(' ').replace(/\s+/g, ' ').trim();
  const category = questionNumber <= 80 ? 'Category-1' : 'Category-2';
  const correctOptions = answer.map((option) => option.toUpperCase());
  const correctOption = correctOptions[0] ?? null;

  return {
    questionNumber,
    questionText,
    optionA: options.A,
    optionB: options.B,
    optionC: options.C,
    optionD: options.D,
    category,
    correctOption,
    correctOptions,
    marks: category === 'Category-1' ? 1 : 2,
    negativeMarks: category === 'Category-1' ? 0.25 : 0,
    answerStatus: 'OFFICIAL_VERIFIED',
    answerSource: 'VERIFIED',
  };
}

async function main() {
  const blocks = parseQuestionBlocks(rawText);
  const questions = blocks.map(parseQuestionBlock).filter((q): q is NonNullable<typeof q> => Boolean(q));

  if (questions.length !== 100) {
    throw new Error(`Parsed ${questions.length} questions. Expected 100.`);
  }

  const paper = await prisma.pyqPaper.findFirst({ where: { year: 2025, title: 'JECA 2025' } });
  if (!paper) {
    throw new Error('JECA 2025 paper was not found.');
  }

  await prisma.pyqQuestion.deleteMany({ where: { paperId: paper.id } });

  const created = await prisma.pyqQuestion.createMany({
    data: questions.map((question) => ({
      paperId: paper.id,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      correctOptions: question.correctOptions,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      category: question.category,
      source: 'Official JECA paper',
      answerStatus: question.answerStatus,
      answerSource: question.answerSource,
      answerConfidence: 1,
    })),
  });

  await prisma.pyqPaper.update({
    where: { id: paper.id },
    data: {
      totalQuestions: 100,
      durationMinutes: 120,
      totalMarks: 100,
      isPublished: true,
      config: { answerKeyVerified: true, importMode: 'verified-replacement', categories: ['Category-1', 'Category-2'], answerSource: 'VERIFIED' },
      source: 'Official JECA paper',
      sourceUrl: 'https://wbjeeb.nic.in/',
    },
  });

  console.log(JSON.stringify({
    paperId: paper.id,
    paperTitle: paper.title,
    inserted: created.count,
    totalQuestions: 100,
    category1: questions.filter((q) => q.category === 'Category-1').length,
    category2: questions.filter((q) => q.category === 'Category-2').length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
