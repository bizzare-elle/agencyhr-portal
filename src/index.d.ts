export interface ApiResponse<T> {
    status: number;
    data: T;
    message: string;
}

export interface Logoverride {
    id: string;
    app_key: string;
    employee_id: number;
    employee_name: string;
    agency_name: string;
    useremail: string;
    date_time: string;
    clock_type: string;
    location: string;
    branch_id: string | null;
    branch_name: string | null;
    image: string;
    is_range: string;
    remarks: string;
    is_logoverride: string;
    status: string;
    status_label: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
}

export interface Overtime {
    id: string;
    edit_id: string;
    employee_id: string;
    employee_name: string;
    branch_id: string;
    branch_name: string;
    date: string;
    reason_disapproval: string;
    no_of_hours: string;
    image: string;
    remarks: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
    deleted_by: string | null;
    deleted_at: string | null;
}

// export interface TimeRecord {
//     employee_id: number;
//     employee_name: string;
//     branch_name: string;
//     schedule_name: string;
//     cut_off: string;
//     clock_in: string | null;
//     clock_out: string | null;
//     total_hrs: string | null;
//     total_hrs_late: string | null;
//     total_overtime: string | null;
// }

export interface Employee {
    id: number;
    firstname: string;
    middlename: string;
    lastname: string;
    name: string;
    employee_name: string;
    birth_date: string;
    age: number | null;
    citizenship: string;
    gender: string;
    civil_status: string;
    trial_date: string;
    date_hired: string;
    date_regularization: string;
    department_name: string;
    tenureship: string | null;
    gender_display: string;
    civil_status_display: string;
    employment_status: string;
    agency_id: string;
    id_number: string;
    branch_id: string;
    branch_name: string;
    agency_name: string;
    address: string;
    is_active: boolean;
    contact_number: string;
    personal_email_address: string;
    company_email_address: string;
    schedule_type: string | null;
    department_id: number;
    department: string;
    position_id: number;
    position_name: string;
    salary_rate: string;
    daily_rate: string;
    hourly_rate: string;
    billing_rate: string;
    allowance: string;
    status: string;
    date_resigned: string | null;
    remarks: string;
    government_tin_nos: string;
    government_sss_nos: string;
    government_philhealth_nos: string;
    government_pagibig_nos: string;
    emergency_contact_name: string;
    emergency_address: string;
    emergency_mobile_no: string;
    emergency_relation: string;
    pay_divisor: string;
    access: string;
    is_chef: string;
    chef_downline_id: string;
    is_direct: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    deleted_at: string | null;
    deleted_by: string | null;
    gross_pay: string | null;
}

export interface Schedule {
    id: string;
    emp_sched_date_id: string;
    branch_id: string;
    branch_name: string;
    date: string;
    status: string;
    status_label: string;
    employee_id: number;
    employee_name: string;
    schedule_name: string;
    schedule_type: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
}

export interface TimeRecord {
    id: number;
    employee_id: number;
    agency_name: string;
    work_date: string | null;
    employee_name: string;
    branch_name: string;
    schedule_name: string;
    employment_status: string;
    id_number: string;
    department_name: string;
    branch: string;
    cut_off: string;
    clock_in: string | null;
    schedule_type: string | null;
    date: string | null;
    time_in: string | null;
    Clock_In: string | null;
    clock_in_branch: string | null;
    clock_out_branch: string | null;
    Clock_Out: string | null;
    time_out: string | null;
    break_in: string | null;
    break_out: string | null;
    Break_In: string | null;
    Break_Out: string | null;
    manhour_conversion: string | null;
    late: number | null;
    manhourArray: string | null;
    overtime: number | null;
    hoursWorked: number | null;
    hours: number | null;
    clock_out: string | null;
    total_hrs: string | null;
    hourly_rate: string | null;
    total_hrs_late: string | null;
    total_undertime_hrs: string | null;
    undertime: string | null;
    total_hours_worked: string | null;
    ot_no_of_hours: string | null;
    total_overtime: string | null;
    is_bill_off: string | null;
    is_half_day: string | null;
    total_hours_worked: string | null;
    undertime_minutes: string | null;
    late_minutes: string | null;
    total_late_minutes: string | null;
    total_schedule_hours: number | null;
    schedule: string | null;
    totWorkedBill: string | null;
    total_overtime_hrs: string | null;
    permission: string | null;
    total_worked_billing_hours: string | null;
    total_hrs_break_late: string | null;
    late_break: number | null;
    branch_timeIn: string | null;
    branch_timeOut: string | null;
    time_records: {
        date: string;
        schedule: string;
        time_in: string | null;
        time_out: string | null;
        break_in: string | null;
        break_out: string | null;
        branch_timeIn: string | null;
        branch_timeOut: string | null;
        hoursWorked: number;
        hours: number;
        late: number;
        late_break: number;
        overtime: number;
        undertime: number;
    }[];
    manhourArray: { category: string; hours: number }[];
}

export interface GroupedEmployee {
    id: string;
    employee_name: string;
    id_number: string;
    branch: string;
    agency_name: string;
    employment_status: string;
    time_records: {
        date: string;
        schedule: string | null;
        time_in: string | null;
        time_out: string | null;
        break_in: string | null;
        break_out: string | null;
        branch_timeIn: string | null;
        branch_timeOut: string | null;
        hoursWorked: number;
        hours: number;
        late: number;
        overtime: number;
        undertime: number;
        late_break: number;
        manhourArray: { category: string; hours: number }[];
    }[];
}
