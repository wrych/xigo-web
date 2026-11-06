---
title: "Minesweeping Agile"
date: 2024-11-15
author: Andy Moesch
topic: software
excerpt: "Minesweeper is a game I liked to play as a child."
original:
  site: LinkedIn
  date: 2021-02-03
  url: https://www.linkedin.com/pulse/minesweeping-agile-andy-moesch/
---

Minesweeper is a game I liked to play as a child. Recently, I have been thinking more about it, since it helps visualizing complexity effective ways to deal with it in software development. This article will dive into the difference between complicated and complicated using the games Sudoku and Minesweeper as respective examples. Right at the end, I will explain what this means for software development. This will be the first of a series of articles I am going to write about software development, so stay tuned!

## Cynefin \| Complex or Complicated

Cynefin is a well known framework that categories tasks into a variety of domains. A task might either be obvious, complicated, complex, chaotic or a combination thereoff.

_The four domains of the Cynefin framework: [see it at its source](https://en.wikipedia.org/wiki/Cynefin_framework)._

For each of the domains, there are specific patterns or practices that yield best results. In this article we will focus on the difference between complicated and complex and the importance of short feedback circles in the complex domain. The reason I will not dive into the obvious domain is that obvious problems are, well… obvious and thus do not require much discussion to solve. On the other end of the scale are chaotic tasks or issues. I argue that we rather rarely face those and if we do so, often chose to dismiss them as too hard or not worth the effort involved. Therefore, we are left with the two domains complicated and complex.

Although the fields are right next to each other and have similar names, the implications of working in either of the fields are significant. I will come back to the issue with the similar names in another article where I am going to talk about the difference between effective and efficient.

But first, let us look at two examples which illustrate the difference between complicated and complex.

## Complicated or Obvious Sudoku

Sudoku is in the complicated domain. One might even consider it an obvious problem, since the rules are tightly constrained. However, harder sudokus are complicated, due to the advanced knowledge of methods (techniques) and sometimes multiple intermediary steps required to solve the puzzles. Furthermore, it is common that tasks shift to lower domains, once enough expertise about a task or issue has been gained. The classification of a task into a domain is to a certain degree individual.

Below, you will find the starting point for a sudoku. Try solving it if you would like. For others who enjoy watching people solving it for you, check out this [youtube](https://www.youtube.com/watch?v=-ZZFEgCQsvA) video by Cracking the Cryptic.

_A hard sudoku by Cracking the Cryptic: [see it at its source](https://www.youtube.com/watch?v=-ZZFEgCQsvA)._

Even though the puzzle is undeniably hard, given the information at the beginning, you may completely solve it. What makes it complicated (i.e. hard) is the “amount of different techniques needed or used” to solve it. Though I doubt I would on my first try, with enough experience and time one could solve it. In such situations, more classical project approaches often work very well.

## Complex Minesweeper

Playing Minesweeper is in the complex domain. The reason being that given the information at the start, one can not solve the puzzle without doing further iterations. This means that however much time you invest into analysing the current state, you may not get any more (valuable) information before taking action. This is very obvious when considering the first move in mine sweeper. I will be using pictures of Google’s [Minesweeper](http://www.google.com/search?q=minesweeper), since it is easily available. Goolge Minesweeper’s hard mode consists of 24×20 (480) fields. There is a total of 99 mines hidden under random squares.

_Google’s Minesweeper on hard: [see it at its source](https://www.google.com/search?q=minesweeper)._

At this point of time, the only valuable information to be extracted is that whatever field chosen to uncover has a 99 in 480 or 21 % chance of being a mine. However, there is a lot more you could consider as to which field is best uncovered first. The main considerations being the tradeoff between the amount of information (statistically) gained and the chance of clicking onto a square with no adjacent mines. The amount of information is higher in the center of the board, while the likelyhood of clicking onto a field with adjacent mines is lowest in the corners. For a more detailed study of the mathematics in mine sweeper, read [Becerra, David J. 2015. Algorithmic Approaches to Playing Minesweeper](http://nrs.harvard.edu/urn-3:HUL.InstRepos:14398552).

If you are bored by now, you are my kind of person. If you have read the full paper about how to optimize playing Minesweeper, well, you are a person of commitment. All things considered, the trade-offs you are making by choosing any specific field to start with are heavily outweighed by the randomness of what happens once you click. It is likely you would have already solved the full puzzle by just starting and repeating until you win before you found an ideal position to start with. And even if you did choose one of the optimal positions, there is the exact same 20.63 % chance that your first click hits a mine.

## Bad Luck Scenario

_An unlucky first guess in Minesweeper: [see it at its source](https://www.google.com/search?q=minesweeper)._

You might think that after the first move things get better, but chances are they don’t. In the worst case scenario, you click onto a field with two adjacent mines. This means that all you have learnt is that out of the 3 to 8 surrounding squares any two could be mines. Now you still do not know which two they are. In any case, you are more likely not to hit a mine by clicking somewhere else randomly (20.59 %) than a adjacent square (25 %). Therefore, you have to take another leap of faith and click a random field.

However, by now you’re chances increased that you will have hit a mine. Life starts to be rough at this point. If you are lucky and hit a field not surrounded by any mines, you might extract more information. But again, you will likely arrive at a point where you need to take a leap of faith to gain new (and valuable) information. But remember the times you’ve played Minesweeper as a child? If you clicked onto a mine, you just started new and had fun anyway. At some point, once the effective patterns were known, we were able to solve many of the puzzles, even though we failed every now and then. This is because we learnt that there is no way of winning the game without taking risks. And we implicitly understood that there was no right or wrong, but luck. And that is where I finally get to talk about software development.

## Complexity in Software Development

In many ways, software development is like playing Minesweeper and very different from solving a Sudoku. In any major software initiative, there will be unknown unknowns. Things we can not know before we actually probed and sensed. If there are no technical complexities, which I haven’t seen so far, there certainly are social ones (customers). Once we have probed and learnt from the feedback, we gathered important information on how to respond. But there are differences between reality and this model. Availabilty of information in reality is not as black as white as in Minesweeper. In reality you may collect more information about any topic, if you are willing to invest enough resources. However, the cost of obtaining information is super linear. That means gathering double the information at any point, is going to cost double or even triple of what has been invested so far. Still, with every bit of information we seem to be reducing the risk for our next action.

## The Risk Trade-Off

While playing Minesweeper casually, the willingness to take risks and thus losing progress is high. The game forces us to make a decision and we understand that there is no other way to progress. In business context I have often faced high reluctance to do the same. The reasons being the cost of ownership and the fear of being wrong, I reckon. However, often gathering more information is more expensive than the cost of taking action if we are willing to accept and learn from the feedback. Especially in well designed software, taking a wrong action means not actually throwing away all progress you have made so far, but rather only what you have invested for that specific action. If your development enables you to do so and your feedback circle is short enough, you might lose one work package (i.e. [increment](https://www.scrumguides.org/scrum-guide.html#increment)) only. This is extremely cheap. In Minesweeper that means reversing your last click and then make another one. After you reversed the step you still know that the field you chose before is a mine and odds change in your favour for the next action. If you didn’t read about what I wrote above and clicked in the bad luck scenario on a mine around a field with two mines, you now know where one mine is. The chances around the same field are now down from 25 % to 14.29 % percent that any other surrounding field is a mine. All in all, if you only lose the progress of one click, whatever the click provides as value in the form of information is worth more than its opportunity cost. You might even learn more from clicking on a mine than hitting a field of grass. In reality as well as in a game of Minesweeper, opportunity costs are high enough and initial information is cheap enough to warrant prioritization of the next actions. In complex scenarios, the next increment should mainly be chosen on on how much we can learn. But again, this is for another talk.

## Summary

As in a game of Minesweeper, the risk of making mistakes can not be avoided in large and thus complex software development initiatives. The more complex the domain, the higher the risk of hitting a mine. Patterns that allow cheap experiments focusing on learning become more important in complex domains. One of the important indicators and enablers for cheap experiments are short feedback circles. In Minesweeper the feedback circle is immediate. Maybe this is why we all intuitively play Minesweeper with a mindset focused on experimentation. Let us Minesweep agile!
