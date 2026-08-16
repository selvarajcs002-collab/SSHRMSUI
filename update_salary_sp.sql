-- Update Employees table column name
IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'SalaryPerMonth'
    AND Object_ID = Object_ID(N'dbo.Employees')
)
BEGIN
    EXEC sp_rename 'dbo.Employees.SalaryPerMonth', 'PerDaySalary', 'COLUMN';
    PRINT 'Renamed column SalaryPerMonth to PerDaySalary in Employees table.';
END
ELSE
BEGIN
    PRINT 'Column SalaryPerMonth does not exist or has already been renamed.';
END
GO

-- Update usp_RegisterEmployeeBasic stored procedure
IF OBJECT_ID('dbo.usp_RegisterEmployeeBasic', 'P') IS NOT NULL
BEGIN
    EXEC('
    ALTER PROCEDURE [dbo].[usp_RegisterEmployeeBasic]
        @Id UNIQUEIDENTIFIER,
        @EmployeeCode NVARCHAR(50),
        @FirstName NVARCHAR(100),
        @LastName NVARCHAR(100),
        @AadhaarNumber NVARCHAR(12),
        @PhoneNumber NVARCHAR(15),
        @Address NVARCHAR(500),
        @City NVARCHAR(100),
        @State NVARCHAR(100),
        @District NVARCHAR(100),
        @Pincode NVARCHAR(20),
        @PanNumber NVARCHAR(20),
        @BloodGroup NVARCHAR(10),
        @MaritalStatus NVARCHAR(50),
        @PerDaySalary DECIMAL(18,2),
        @Referral NVARCHAR(100),
        @IsConfirmed BIT,
        @Status INT,
        @CreatedAt DATETIME,
        @UpdatedAt DATETIME,
        @Email NVARCHAR(255),
        @Designation NVARCHAR(100),
        @DepartmentName NVARCHAR(100),
        @ProfilePicture NVARCHAR(MAX) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;

        INSERT INTO [dbo].[Employees] (
            [Id], [EmployeeCode], [FirstName], [LastName], [AadhaarNumber], 
            [PhoneNumber], [Address], [City], [State], [District], [Pincode], 
            [PanNumber], [BloodGroup], [MaritalStatus], [PerDaySalary], [Referral], 
            [IsConfirmed], [Status], [CreatedAt], [UpdatedAt], [Email], 
            [Designation], [DepartmentName], [ProfilePicture]
        )
        VALUES (
            @Id, @EmployeeCode, @FirstName, @LastName, @AadhaarNumber, 
            @PhoneNumber, @Address, @City, @State, @District, @Pincode, 
            @PanNumber, @BloodGroup, @MaritalStatus, @PerDaySalary, @Referral, 
            @IsConfirmed, @Status, @CreatedAt, @UpdatedAt, @Email, 
            @Designation, @DepartmentName, @ProfilePicture
        );
    END
    ');
    PRINT 'Updated stored procedure usp_RegisterEmployeeBasic.';
END
GO

-- Update usp_UpdateEmployee stored procedure
IF OBJECT_ID('dbo.usp_UpdateEmployee', 'P') IS NOT NULL
BEGIN
    EXEC('
    ALTER PROCEDURE [dbo].[usp_UpdateEmployee]
        @Id UNIQUEIDENTIFIER,
        @FirstName NVARCHAR(100),
        @LastName NVARCHAR(100),
        @AadhaarNumber NVARCHAR(12),
        @PhoneNumber NVARCHAR(15),
        @Address NVARCHAR(500),
        @City NVARCHAR(100),
        @State NVARCHAR(100),
        @District NVARCHAR(100),
        @Pincode NVARCHAR(20),
        @PanNumber NVARCHAR(20),
        @BloodGroup NVARCHAR(10),
        @MaritalStatus NVARCHAR(50),
        @PerDaySalary DECIMAL(18,2),
        @Referral NVARCHAR(100),
        @Status INT,
        @IsConfirmed BIT,
        @EmployeeCode NVARCHAR(50),
        @UpdatedAt DATETIME,
        @Email NVARCHAR(255),
        @Designation NVARCHAR(100),
        @DepartmentName NVARCHAR(100),
        @ProfilePicture NVARCHAR(MAX) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;

        UPDATE [dbo].[Employees]
        SET [FirstName] = @FirstName,
            [LastName] = @LastName,
            [AadhaarNumber] = @AadhaarNumber,
            [PhoneNumber] = @PhoneNumber,
            [Address] = @Address,
            [City] = @City,
            [State] = @State,
            [District] = @District,
            [Pincode] = @Pincode,
            [PanNumber] = @PanNumber,
            [BloodGroup] = @BloodGroup,
            [MaritalStatus] = @MaritalStatus,
            [PerDaySalary] = @PerDaySalary,
            [Referral] = @Referral,
            [Status] = @Status,
            [IsConfirmed] = @IsConfirmed,
            [EmployeeCode] = @EmployeeCode,
            [UpdatedAt] = @UpdatedAt,
            [Email] = @Email,
            [Designation] = @Designation,
            [DepartmentName] = @DepartmentName,
            [ProfilePicture] = @ProfilePicture
        WHERE [Id] = @Id;
    END
    ');
    PRINT 'Updated stored procedure usp_UpdateEmployee.';
END
GO
