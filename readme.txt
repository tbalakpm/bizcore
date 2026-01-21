Registers under Categories:
---------------------------
I - Income/Revenue
E - Expense
    Medical Insurance
A - Asset
    Cash        - Balance
    Banks       - Bank name, Branch name, Account number, Account type(SB, Current), IFSC, CIF, Balance
    Gold        - Weight in grams, Purity (8,16,22,24-916,etc), Value, Value date
    Silver      - Weight in grams, Purity, Value, Value date
    Land        - Address, Registered date, Value, Value date,
    Building    - Address, Value, Value date
    Loan (Lend) - Person, Amount, Date, Interest %, Repayment schedule, Balance
    Insurance   - Company, Type (Life [endowment, money-back, unit-linked], Term, Health, Motor), Payment schedule, Repayment schedule
    Deposits    - Institute, Amount, Maturity date, Interest %, Maturity amount
    Vehicles    - Type (two, four), Brand, Make, Year, Value, Value date
    SIP         - 
    Savings     - Postoffice (SB, RD), Chit, etc.,
L - Liability
    Credit cards    - Bank (mapping), Card number (last 4 digits), Expiry, EMI
    Loan (Borrow)   - Person, Amount, Date, Interest %, Repayment schedule, Balance
C - Capital/Equity
D - Document
P - Person (People)


// "postbuild": "xcopy src\\static dist\\static /E /I" // For Windows

> turso dev --db-file <db-filename>
