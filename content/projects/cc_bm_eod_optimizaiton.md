---
# Copy this file to a new name (for example staffing-forecast.md) and edit.
# Delete `draft: true` to make it appear on the portfolio page.
# This file stays hidden as long as draft is true.

title: EOD Kaizen
description: Developed tool for coordinators and leaders to make confident decisions with EOD staffing and operational moves. First built on Excel, transitioning to a full-stack web application!
stack:
 - excel
link:
featured: false   # true renders a wide, olive card
span: 4           # optional: 4, 5, 6, 7 or 8. Ignored when featured is true.
order: 1          # lower numbers sort first
draft: false
---

# Cycle Count and Bin Maintenance Optimization Tool

To preface, here is the operational question: How many partners (H-E-B's word for an employee) do we need at EOD to complete CC (Cycle Counts) and BM (Bin Maintenance) at the end of day?

Two leaders and I were pondering that question one evening because we had an opportunity in that area. I took that question and ran with it:

## The Excel Tool

The CC/BM tool is an Excel workbook that measures how long each CC and BM task takes in the AutoStore at an H-E-B eFC (eFulfillment Center). It works from the inventory transactions exported from SYNQ (our AutoStore inteligence portal) and breaks the results down by zone, by day, by weekday, and by partner. The two zones are ASA (AutoStore Ambient) and ASC (AutoStore Chilled).

## How the workbook is laid out

The data moves in one direction. The four transaction tabs hold the raw SYNQ rows, the two zone summaries turn those rows into one line per day, and Montly Data and Weekly Data combine the zones by date and by weekday. The two partner tabs read the transaction tabs directly and compare each partner against the facility average from Montly Data.

```
SYNQ export
    |
    v
ASA CC, ASA BM, ASC CC, ASC BM Inventory Transactions      Roster
    |                                   |                     |
    v                                   v                     v
ASA Summary, ASC Summary            Partner Data, Partner Deep Dive
    |                                   ^
    v                                   |  facility Average Time per Task (G6)
Montly Data, Weekly Data ---------------+
```

Each transaction table has the same six columns. The first three come straight from the SYNQ export: Create Date (the transaction's timestamp, down to the millisecond), From TU (the TU, or transport unit, i.e., the AutoStore bin), and Updated By (the ID of the user who made the transaction). The last three are helper columns: Time To Complete, Partner, and Date.

## How task time is measured

The SYNQ export does not have a duration column. What it does have is two transactions for every task, each with its own Create Date. Thus, the time to complete a task is simply the gap between its two timestamps.

Once a table is sorted by From TU, the two transactions for each task sit on back-to-back rows with the later one on top. From there, the workbook pairs rows by position: row 1 with row 2, row 3 with row 4, and so on down the table. The three helper columns do the rest. Each formula below is written the way it appears in the first data row (row 2), so A1 and C1 point at the row above.

Time To Complete:

```
=IF(ISODD(ROW()),A1-[@[Create Date]])
```

On odd rows, this subtracts the row's Create Date from the Create Date above it, which gives the time between the task's two transactions. Even rows return FALSE. That way, each task gets exactly one Time To Complete, and the Number of CCs and Number of BM counts on the zone summaries skip the FALSE rows.

Partner:

```
=IF(ISNUMBER(INT(RIGHT(C1, 1))), C1, "")
```

This copies Updated By from the row above, but only when that ID ends in a digit. In other words, the partner who made the top transaction gets credited on the same odd row as the Time To Complete. The even rows stay blank because the other transaction in each pair is not under a partner ID, which leaves exactly one Partner value per task. Notably, if a partner's ID ever does not end in a digit, their tasks will still count toward the facility totals but will not show up under their name.

Date:

```
=IF([@[Create Date]], INT([@[Create Date]]), "")
```

INT drops the time of day and leaves the date. Rows without a Create Date return an empty string, so they do not land on any day.

Unfortunately, pairing by position is also the most fragile part of the workbook. If a task ever shows up with one transaction instead of two, every pair below it shifts by a row, and every Time To Complete below that point measures the gap between two different tasks. It will not throw an error, so Known issues has a check column that catches it.

## Loading a new period

The workbook holds one period at a time, and loading one takes three steps.

First, export the period's inventory transactions from SYNQ for each of the four tables: ASA CC, ASA BM, ASC CC, and ASC BM. Each export needs the Create Date, From TU, and Updated By columns.

Then, with the three rows necessary, paste those into the respective tables based on task. You then want excel to complete the sorting for you. Sort the create date from latest to oldest, then sort the From TU by ascending. This will allow for each of the TUs to be paired up, and base on the standard that one bin will only get CC'ed or BM'ed once in a day, naturally the tasks start and end time will be paired.

Third, there will be instances where a task only has one create date transaction, or more than two. To save some time, parse through the Time to Complete collumn and search for anything starting in "#." This is where you will find the tasks that have such discrepancies. Do some analyzing and delete the extra or single task's row(s), and search again. Once all have been cleared (which is usually only about one to three tasks) the table is complete and in working order.

Once this has been completed for each of the four data tabs, all of the data will populate and be calculated for you.

## Reading the results

### ASA Summary and ASC Summary

These two tabs share a layout, one per zone. The block at the top covers the whole period: Number of CCs and Number of BM, Total Days Data, Average Time per Task, and Average Deviation. Average Deviation is AVEDEV of every task's time, i.e., how far a single task's time lands from the average, on average. In other words, it measures how consistent the tasks are; the smaller it is, the more alike they are.

The daily table starts at row 12 with one row per date. The date column (labeled Day of March) lists every date with at least one CC transaction, oldest first. Columns C and D total the time spent on CC and BM that day, and E and F count the tasks. Because every task is two rows in the export, E and F take the day's row count and divide it by two.

G adds the two task counts, and J adds the two times. H and I count the distinct partners who did CC or BM that day, and K counts the distinct partners across both, so someone who did both only counts once. Column L has no header: it holds the weekday number (1 for Monday through 7 for Sunday) that Weekly Data groups by.

### Montly Data

Montly Data combines both zones into one row per date. Columns C through H add the ASA and ASC figures together (tasks, time, and partners for CC and BM), I and J give the day's total tasks and total time, and K recounts the distinct partners across all four tables. L divides total time by total tasks for the Time per Task, and M divides it by K for the Time per Partner.

The time columns are the sum of every task's duration, so they read as labor time, not clock time: two partners working the same hour count as two hours. They also only include the time between each task's two transactions. In other words, Time per Partner is how much of a partner's day went into tasks, not how long they were assigned to the work.

Partners on CC (G) plus Partners on BM (H) can add up to more than K. G and H add the zones together, so a partner who worked both zones or both task types counts more than once, while K counts each person once.

The block at the top averages the first 30 rows: Average # of Tasks, Average Partners on Task per Day, Average Time per Day, Average Time per Partner per Day, and Average Time per Task, along with the Number of Days of Data. Average Time per Task (G6) is the facility benchmark that both partner tabs compare against. The Tasks vs Time chart plots total tasks as columns and total time as a line on a second axis, and the color scales on I and J run blue for light days and red for heavy ones.

### Weekly Data

Weekly Data answers the scheduling question directly: what does a typical Monday look like, or a typical Saturday? There is one block per zone, ASA on top and ASC below, with a row for each weekday. Each column averages its matching zone summary column across every date that falls on that weekday: Average CC, Average BM, Average Total Tasks, Average Partners per Day, and Average Hours per Day.

The last column, Average Task Dev, is meant to show how much the day's task count swings on that weekday. However, it is currently shifted by a day (see Known issues). The two charts plot Average Total Tasks as columns against Average Hours per Day as a line, one chart per zone, and color scales shade each column so the heaviest weekdays stand out.

### Partner Data

Partner Data lists every partner who completed at least one task in the period, across all four tables. Column B holds their OnePass (their user ID), and C looks up their name from Roster_flip. D and E total their tasks and time across both zones and both task types, F divides the two for their Average Time, and G is their Performance, explained below. Treat Performance with caution for anyone with only a handful of tasks, since a few long ones can swing it either way.

### Partner Deep Dive

Partner Deep Dive shows one partner at a time. Pick a name in C4 from the dropdown, which reads from Roster, and C5 will look up their OnePass. (C4 is locked at the moment, so the tab has to be unprotected first; see Known issues.) The four blocks below split their work by zone and task type (ASA CC, ASA BM, ASC CC, and ASC BM), with one row per day they did that task: the date, their average time per task that day, the number of tasks, and the total time.

Row 8 totals each block, and the figures at the top (Total Time, Total Tasks, and Ave per Task) cover all four. Overall Performance (J3) uses the same calculation as Partner Data. This tab is where I would start when a partner's number looks off, because the blocks show whether a low score comes from one task type, one zone, or one bad day.

## How Performance is calculated

Performance divides the facility's Average Time per Task (Montly Data G6) by the partner's own average time per task:

```
Performance = facility average time per task / partner average time per task
```

Because the partner's time is on the bottom, faster is higher: 100% is exactly the facility average, above 100% is faster, and below 100% is slower. For example, if the facility averages 60 seconds per task and a partner averages 50, their Performance is 60 / 50, or 120%.

Unfortunately, the comparison has two slight drawbacks. First, the facility average blends all four task types together, so it is only fair between partners who do a similar mix of work. If a BM task takes longer than a CC task, a partner who mostly does BM will score low even if they are fast at BM. A mix-adjusted version for Partner Deep Dive compares the partner against how long the facility would take for their exact mix of tasks:

```
=(E8*'ASA Summary'!F7 + J8*'ASA Summary'!H7 + O8*'ASC Summary'!F7 + T8*'ASC Summary'!H7) / G5
```

To simplify, this multiplies the partner's task count in each block by the facility's average time for that task type, adds those together, and divides by the time the partner actually took. A result of 100% still means facility pace. It can sit next to Overall Performance, formatted as a percentage.

Second, G6 is the average of the daily Time per Task values, so every day counts the same no matter how many tasks it had. The note on Partner Deep Dive calls it a weighted average, which is only true within each day. A fully weighted benchmark would replace the formula in G6 with:

```
=SUM(J9:J38)/SUM(I9:I38)
```

The two only drift apart when the light days run noticeably faster or slower than the heavy ones.

## Known issues

None of these are the errors in the blank copy, which clear up once data is pasted in. These are things that still happen with data loaded: the first three show up on any normal period, and the rest only come up when the data is unusual. Most of them live on protected tabs, so unprotect the tab first (Review, then Unprotect Sheet).

### Problems with normal data

#### Average Task Dev is shifted by a day

On Weekly Data, the Average Task Dev column (I) uses WEEKDAY with its default numbering, where 1 is Sunday. The rest of the tab uses column L of the zone summaries, where 1 is Monday. Thus, the Monday row shows Sunday's figure, Tuesday shows Monday's, and so on down to the Sunday row, which shows Saturday's. It still returns a number, so nothing looks wrong on screen.

Using column L fixes it. For the ASA Monday row (I7):

```
=AVEDEV(FILTER('ASA Summary'!$G$12:$G$200, 'ASA Summary'!$L$12:$L$200=1))
```

Change the 1 to 2 through 7 going down the rows, and point the ASC block (I17:I23) at ASC Summary. This version also removes the 28-day limit covered further down.

#### Time formats drop hours

On Partner Deep Dive, most of the Total Time cells in the two ASA blocks (columns F and K) use mm:ss.0, which hides the hours: 1:05:00 shows as 05:00.0. The totals (G5 and row 8) use h:mm:ss, which rolls over at 24 hours, so a partner with 30 hours in the period shows 6:00:00. The values underneath are right, and so are the averages and Performance built on them; only the display is off. Formatting those cells as [h]:mm:ss fixes it, which is what Partner Data's Total Time already uses. Montly Data's daily time columns (E, F, and J) use h:mm:ss as well, which is fine until a single day's total passes 24 hours.

#### The Partner Deep Dive name cell is locked

Partner Deep Dive is protected, and C4 (the name dropdown) is a locked cell, so a name cannot be picked until the tab is unprotected. To fix it, unprotect the tab, open Format Cells on C4, clear the Locked box on the Protection tab, and protect the tab again. While you are in there, the dropdown's source ('Roster'!$B$2:$B$330) includes the Full Name header as a choice and stops two rows short of the Roster table. Setting the source to this formula will follow the table as it grows:

```
=INDIRECT("Roster[Full Name]")
```

### Edge cases

#### Leftover blank rows get counted

This is the step 2 problem from Loading a new period, repeated here because nothing on screen flags it. Blank rows inside a transaction table get counted in Number of CCs and Number of BM, and if the helper formulas run into them, every other blank row adds a zero-second task that drags the zone averages down. INT also turns a blank Create Date into a date of zero, which shows up as an extra day at the top of the date list and can knock the zones out of line on Montly Data (see below).

Deleting old rows as table rows avoids all of it. To also harden the date list, build it from the Date column instead (ASA Summary B12 shown):

```
=LET(d, VSTACK(ASA_CC_Inventory_Transactions[Date], ASA_BM_Inventory_Transactions[Date]), SORT(UNIQUE(FILTER(d, ISNUMBER(d)))))
```

Notably, this version also picks up days that only had BM activity. The current date list comes from the CC table alone, so a day with BM but no CC is left out of the daily rows and everything built on them. If you switch to it, apply the partner count fix below as well, since a BM-only day would otherwise show one partner on CC.

#### Broken pairs are silent

Because Time To Complete pairs rows by position, one task with an odd number of transactions will throw off every pair below it without any error. A check column will catch it. Add a column called Pair Check to each transaction table (row 2 formula shown):

```
=IF(ISODD(ROW()), B1=[@[From TU]], "")
```

Every odd row should show TRUE, since both halves of a pair are on the same bin. A single cell can then count the problems, and it should always read zero:

```
=COUNTIF(ASA_CC_Inventory_Transactions[Pair Check], FALSE)
```

A negative Time To Complete is the other thing to look for: it means a pair is upside down, i.e., the older transaction is on top.

#### Partner counts are off on days with no tasks of one type

The partner counts (H, I, and K on the zone summaries, and K on Montly Data) wrap FILTER in COUNTA. When FILTER finds nothing, it returns a #CALC! error, and COUNTA counts that error as if it were a partner. As a result, a day with no BM tasks in a zone will show one partner on BM instead of zero, and the combined counts will be off for that day as well. Giving FILTER an empty string to return instead, then counting only the non-empty results, fixes it. For Partners on CC (H12):

```
=IF(B12, SUM(--(UNIQUE(FILTER(ASA_CC_Inventory_Transactions[Partner], (ASA_CC_Inventory_Transactions[Date]=B12)*(ASA_CC_Inventory_Transactions[Partner]<>""), ""))<>"")), "")
```

For Total Partners (K12):

```
=IF(B12, LET(bm, FILTER(ASA_BM_Inventory_Transactions[Partner], (ASA_BM_Inventory_Transactions[Date]=B12)*(ASA_BM_Inventory_Transactions[Partner]<>""), ""), cc, FILTER(ASA_CC_Inventory_Transactions[Partner], (ASA_CC_Inventory_Transactions[Date]=B12)*(ASA_CC_Inventory_Transactions[Partner]<>""), ""), SUM(--(UNIQUE(VSTACK(bm, cc))<>""))), "")
```

The partner list on Partner Data has the same weakness and will pick up a #CALC! if any of the four tables is empty.

#### Montly Data assumes both zones have the same dates

Columns C through H on Montly Data add ASA Summary and ASC Summary row by row, i.e., row 9 adds row 12 of each tab. That works as long as both zones have exactly the same dates, which is the normal case. However, if one zone has a date the other does not (or a leftover day zero), every row from there down adds two different days together, and the extra date lands at the bottom of the list instead of in order. Looking each value up by date fixes it. For B9:

```
=SORT(UNIQUE(VSTACK('ASA Summary'!B12#, 'ASC Summary'!B12#)))
```

And for C9, with D through H following the same shape, each pulling the same summary column it pulls today:

```
=IF(B9, SUMIF('ASA Summary'!$B$12:$B$200, B9, 'ASA Summary'!$E$12:$E$200) + SUMIF('ASC Summary'!$B$12:$B$200, B9, 'ASC Summary'!$E$12:$E$200), "")
```

#### Average Task Dev only fits a 28-day period

The current Average Task Dev formula pairs a fixed 28-row range (G12:G39) with the date list, so a period with any other number of days (including a leftover day zero) will return #VALUE!. The fix under Average Task Dev above removes this limit.

### Smaller cleanup

A few labels do not match what they sit on. Both zone summaries label the date column Day of March, the ASC Summary daily table is titled ASA Daily Data, and the Montly Data tab name is missing an "h" (renaming it is safe, since Excel updates every formula and chart that points at it). On the structure side, the ASC BM block on Partner Deep Dive stops at row 37, one day short of the other three, and Montly Data has headerless formulas in N37:O200 (CC time per CC task and BM time per BM task) with nothing in rows 9 through 36. Finally, the filter on Partner Data starts at D5, the first partner, instead of the D4 header.

## Limits

The workbook is sized for one period. Past most of these limits, the spilled columns keep growing but the formulas beside them stop, so numbers go missing without an error.

| Area | Built for |
|---|---|
| ASA Summary and ASC Summary | 189 days (rows 12 to 200) |
| Montly Data | 192 days (rows 9 to 200), but the averages at the top only read the first 30 |
| Partner Data | 84 partners (rows 5 to 88) |
| Partner Deep Dive | 28 days per block, 27 for ASC BM (rows 11 to 38) |
| Roster | 330 names (rows 3 to 332) |

## Next steps

My next steps are simple in wording. I want to take this Excel tooling and convert it to an application that makes an API GET request of the SYNQ data and imports automatically. I want to have a Java backend clean and parse the data itself and calculate all the information the Excel tool does. Then I want to push that to a front end that is easy to navigate and read, giving the most wanted information in the right spot, at the right time, to the right partner, so that operational leads and coordinators can make even better live decisions to optimize EOD tasks further. 

Stay tuned, as this is my next big project!