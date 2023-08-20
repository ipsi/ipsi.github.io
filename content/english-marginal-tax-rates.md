+++
title = "English Marginal Tax Rates"
date = 2018-07-11T16:55:00Z
+++
This is a look at the English marginal tax rates, and how the default assumption that there are three (Basic, Higher, Additional) isn't at all correct, and how increasing your pension contribution doesn't cost you nearly as much as you might think.

Unlike what I suspect most of my posts will be, this isn't a technical post, more just a place to record some things I have been thinking about.

In most (almost all?) countries, the government applies taxes to your income based upon "[progressive, marginal tax rates](https://www.cbpp.org/research/federal-tax/policy-basics-marginal-and-average-tax-rates)". So all income between `A` and `B` is taxed at `X%`, `B + 1` and `D` at `Y%`, `D + 1` or more at `Z%`. In the UK, the [official](https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past#tax-rates-and-bands) tax rates (factoring in your personal allowance, which we'll cover soon) are:

| Lower Threshold | Upper Threshold | Rate          |
|-----------------|-----------------|---------------|
|              £0 |         £11,850 |            0% |
|         £11,851 |         £46,350 |  20% (Basic)  |
|         £46,351 |        £150,000 |  40% (Higher) |
|        £150,001 |                 |  45% (Addtnl) |

Note the names in brackets - the 20% rate is called the "Basic Rate", the 40% rate is the "Higher Rate", and the 45% rate is the "Additional Rate".

This post makes a few simplifying assumptions:
1. You haven't lost your tax-free allowance for any reason (e.g. foreign income taxed on a remittance basis)
2. You live in England (the Scottish system has different thresholds, for example)
3. You have a post-2012 English student loan
4. You're entitled to exactly zero benefits
5. We are talking only about the 2018/2019 tax year - _all_ the details might be different for any other tax year.
6. You are employed, pay tax via PAYE, and don't have to file a self-assessment.

Now, that seems fairly straightforward, right? If you earn £25,000/year, you pay £2,630 in tax, which is `(25000-11850)*0.2`. If you earn £50,000/year, you pay £8,360 in tax, which is `(46350-11850)*0.2 + (50000-46350)*0.4`.

Except... That's actually not the case. You also have to pay [National Insurance Contributions](https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions) (also called "NICs"), as does your employer. If you have a student loan, that can be considered a [graduate tax](https://www.moneysavingexpert.com/students/student-loans-tuition-fees-changes/#gradtax) for this purpose as well. Plus, if you earn over £100,000, your Personal Allowance starts to [decrease](https://www.gov.uk/income-tax-rates/income-over-100000).

If you want to see how the tax is broken down on your income, have a look at [UK Tax Calculators](https://www.uktaxcalculators.co.uk/) - I have no affiliation, I just find it _really_ useful.

So, what does this all work out to?

## Personal Allowance
First, let's have a look at your Personal Allowance, and how that actually works.

It turns out, the table above was a little misleading - it suggests that the threshold for the Basic Rate is £11,850. That is not the case. Rather, you _subtract_ your personal allowance from your income before paying tax.

So, the table should _really_ look like this:

| Lower Threshold | Upper Threshold | Rate          |
|-----------------|-----------------|---------------|
|         £     0 |         £34,500 |  20% (Basic)  |
|         £34,501 |        £150,000 |  40% (Higher) |
|        £150,001 |                 |  45% (Addtnl) |

Now, in our first example, that doesn't really matter, since at £25,000, you're only being taxed at the basic rate anyway.

In our second example, though, of earning £50,000, you would subtract the personal allowance of £11,850 from your gross income, giving us £38,150. Of that, £3,650 is taxed at the higher rate, and £34,500 is taxed at the basic rate. The end result is the same for anyone earning <£100,000/year.

Going forwards, we'll continue to use the first table, as that's a lot easier to deal with as all the other thresholds (NI, Student Loan, etc) don't care about the personal allowance, and most people will only lose their personal allowance when earning over £100,000.

## Personal Allowance Reduction
Now, let's factor the cost of losing your Personal Allowance in. You lose £1 of allowance for every £2 of income over £100,000. As we've just seen, you'd subtract your personal allowance from your gross income before paying tax. But, because we're earning over £100,000/year, we get less personal allowance to subtract.

What that means is that, if you got a raise of £2/year (very stingy) from £100,000 to £100,002, you would expect to pay an extra £0.80 in tax, based on the above table, correct? 40% of the extra income. However, we've lost £1 of our personal allowance, which was _saving_ us £0.40 of tax, so we actually have to pay that on top of our £0.80 tax, for a total of £1.20 in tax, or 60%. You can read more about this "60% tax rate" in the Hargreaves Lansdown article "[Are you caught in a 60% income tax trap?](http://www.hl.co.uk/news/articles/are-you-caught-in-the-income-tax-trap)". Based on this, we can update our original table:

| Lower Threshold | Upper Threshold | Rate          |
|-----------------|-----------------|---------------|
|              £0 |         £11,850 |            0% |
|         £11,851 |         £46,350 |  20% (Basic)  |
|         £46,351 |        £100,001 |  40% (Higher) |
|        £100,002 |        £123,700 |       60% (?) |
|        £123,701 |        £150,000 |  40% (Higher) |
|        £150,001 |                 |  45% (Addtnl) |

As we can see, there is a brief period where your marginal tax rate is 60%, before dropping back down to 40%, and then climbs again to 45%. This isn't an _official_ marginal tax rate, so it doesn't have a name like the others.

## Employee National Insurance Contributions
Next, let's add in your NICs. It can be tricky to figure out exactly what you need to pay, and it depends on what your [National Insurance class and category letter](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2018-to-2019#class-1-national-insurance-rates) are. For these purposes, I will assume that we are talking about Class 1, Category A (which is _by far_ the most common if you're on PAYE).

The first threshold for NI contributions is £8,424/year, and you pay 12% of all your income from £8,424 up to £46,350. From £46,351/year, it drops down to 2%. Updating our table with those rates,

| Lower Threshold | Upper Threshold | Tax Rate      | NI Rate |
|-----------------|-----------------|---------------|---------|
|              £0 |          £8,424 |            0% | 0%      |
|          £8,424 |         £11,850 |            0% | 12%     |
|         £11,851 |         £46,350 |  20% (Basic)  | 12%     |
|         £46,351 |        £100,001 |  40% (Higher) | 2%      |
|        £100,002 |        £123,700 |       60% (?) | 2%      |
|        £123,701 |        £150,000 |  40% (Higher) | 2%      |
|        £150,001 |                 |  45% (Addtnl) | 2%      |

This means that all earnings over £11,850 are effectively taxed at 32%, not the listed 20%. That said, since this is a progressive, marginal system, your _effective_ tax rate is much less. We'll cover a couple more things first, and then look at what your effective tax rate is.

## Student Loans
As I mentioned earlier, the UK student loan system can be thought of as a "Graduate Tax". I don't want to dive into exactly what that means, as there have already been a _lot_ of discussions about why that could be. For now, let's just assume it is a form of tax, and apply it to our marginal tax rates. We will assume that you have a post-2012 Student Loan, though the pre-2012 loan merely adjusts the threshold, rather than the rate.

With a post-2012 student loan, you repay 9% of all income over £25,000. Simple and straightforward. Adding that to our table,

| Lower Threshold | Upper Threshold | Tax Rate      | NI Rate | Student Loan |
|-----------------|-----------------|---------------|---------|--------------|
|              £0 |          £8,424 |            0% | 0%      | 0%           |
|          £8,424 |         £11,850 |            0% | 12%     | 0%           |
|         £11,851 |         £25,000 |  20% (Basic)  | 12%     | 0%           |
|         £25,001 |         £46,350 |  20% (Basic)  | 12%     | 9%           |
|         £46,351 |        £100,001 |  40% (Higher) | 2%      | 9%           |
|        £100,002 |        £123,700 |       60% (?) | 2%      | 9%           |
|        £123,701 |        £150,000 |  40% (Higher) | 2%      | 9%           |
|        £150,001 |                 |  45% (Addtnl) | 2%      | 9%           |

## Combined Tax Rates
Now, this is starting to look a bit complicated. Let's merge this all together, so we can see what the effective marginal tax rate is at each threshold.

| Lower Threshold | Upper Threshold | Rate |
|-----------------|-----------------|------|
|              £0 |          £8,424 |   0% |
|          £8,424 |         £11,850 |  12% |
|         £11,851 |         £25,000 |  32% |
|         £25,001 |         £46,350 |  41% |
|         £46,351 |        £100,001 |  51% |
|        £100,002 |        £123,700 |  71% |
|        £123,701 |        £150,000 |  51% |
|        £150,001 |                 |  56% |

## Effective Tax Rate
Now, that looks pretty scary - the highest marginal tax rate is 71%! But what's the _effective_ tax rate at each threshold? That is, what percentage of your total income goes to paying tax, assuming you earn _exactly_ the upper threshold amount? As we'll see in the following table, it's not quite as bad as it looks.

| Lower Threshold | Upper Threshold | Rate     |
|-----------------|-----------------|----------|
|              £0 |          £8,424 |       0% |
|          £8,425 |         £11,850 |    3.47% |
|         £11,851 |         £25,000 |   18.48% |
|         £25,001 |         £46,350 |   28.85% |
|         £46,351 |        £100,001 |   40.73% |
|        £100,002 |        £123,700 |   46.53% |
|        £123,701 |        £150,000 |   47.32% |
|        £150,001 |                 |  >47.32% |

The absolute limit would be ~51%, if your salary were several _million_ pounds.

Now, all this means is that if you're earning _exactly_ £46,350/year, you will pay 28.85% of that in tax - if you're earning less, the percentage of your income that you pay will be lower as well.

In any event, this looks a bit nicer - yes, it's not quite as nice as it just being a flat 20% up to £46,350, but it's a lot better than paying 41% on everything.

## Pension Contributions
There's one last major quirk, and that's about your pension. I can only talk about salary sacrifice here, as that's all I'm familiar with.

If your employer uses salary sacrifice, you would reduce your taxable income by the amount you contribute to your pension. And this reduces the amount of _all_ types of tax you pay - Student Loan, National Insurance, normal tax, etc. It even gives you back some of your basic allowance, if you're over £100,000.

So, what does this mean in practice?

Well, if you earn, say, £65,000, and you have a student loan, you pay a total of 	£22,887.52 in taxes, giving you a net income of £42,112.48. Now, let's say you contribute 5% to your pension. That would be £3,250/year, which reduces your taxable income to £61,750, at which point you only pay £21,230.02 in taxes. Your net income is now £40,519.98, which is £1,592.50 lower than before you paid in your pension contribution. But you're contributing £3,250 to your pension!

Because your marginal tax rate is 51% (as we talked about earlier), and because salary sacrifice reduces your taxable income, you are effectively contributing £1,657.5 of taxes to your pension, rather than paying it directly to the government. That's a pretty good deal. Yes, you'll have to pay taxes on it when you draw it down after retirement (probably - that gets quite complex), but that's potentially less than you're paying now.


## Employer National Insurance Contributions
This is going to be a little controversial, but I think it's worth looking at. On top of the other taxes, your employer will contribute a percentage of your income as their NICs. Again, the exact amount depends on your letter code and class.

Now, you never see this money, so thinking about it as being a tax on _your_ income isn't quite accurate. On the other hand, one could argue that if the employer wasn't paying this contribution, they would be able to pay it you, instead.

This is probably only true in a _very_ limited subset of jobs, where you're in-demand and hard to replace. It will not be true if you're being paid minimum wage.

So, let's assume that you _are_ in a job like that, where your employer might well be willing to pay you their share of NI contributions, if they could.

How would we account for this?

Well, we're looking at how much of _your_ income is being paid in tax, but as Employer NICs aren't part of your income it's a bit tricky to figure out how to account for them. I'm honestly not sure what the best approach is, so I will take the rate for Employer NICs and add it the other marginal rates, unless someone can suggest a better way.

Adding this to our table of marginal rates gives us

| Lower Threshold | Upper Threshold | Tax Rate      | NI Rate | Student Loan | Employer NI |
|-----------------|-----------------|---------------|---------|--------------|-------------|
|              £0 |          £8,424 |            0% | 0%      | 0%           |          0% |
|          £8,424 |         £11,850 |            0% | 12%     | 0%           |       13.8% |
|         £11,851 |         £25,000 |  20% (Basic)  | 12%     | 0%           |       13.8% |
|         £25,001 |         £46,350 |  20% (Basic)  | 12%     | 9%           |       13.8% |
|         £46,351 |        £100,001 |  40% (Higher) | 2%      | 9%           |       13.8% |
|        £100,002 |        £123,700 |       60% (?) | 2%      | 9%           |       13.8% |
|        £123,701 |        £150,000 |  40% (Higher) | 2%      | 9%           |       13.8% |
|        £150,001 |                 |  45% (Addtnl) | 2%      | 9%           |       13.8% |

Which, when merged together, gives us marginal rates of

| Lower Threshold | Upper Threshold | Rate   |
|-----------------|-----------------|--------|
|              £0 |          £8,424 |   0%   |
|          £8,424 |         £11,850 |  25.8% |
|         £11,851 |         £25,000 |  45.8% |
|         £25,001 |         £46,350 |  54.8% |
|         £46,351 |        £100,001 |  64.8% |
|        £100,002 |        £123,700 |  84.8% |
|        £123,701 |        £150,000 |  64.8% |
|        £150,001 |                 |  69.8% |

And effective tax rates of

| Lower Threshold | Upper Threshold | Rate     |
|-----------------|-----------------|----------|
|              £0 |          £8,424 |       0% |
|          £8,425 |         £11,850 |    7.46% |
|         £11,851 |         £25,000 |   27.63% |
|         £25,001 |         £46,350 |   40.14% |
|         £46,351 |        £100,001 |   53.37% |
|        £100,002 |        £123,700 |   59.39% |
|        £123,701 |        £150,000 |   60.34% |
|        £150,001 |                 |  >60.34% |

So, once we take Employer NICs into account, the government is receiving tax equivalent to anywhere up to 60% of your income, if you earn enough.
