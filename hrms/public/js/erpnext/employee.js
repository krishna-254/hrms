// Copyright (c) 2016, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("Employee", {
	refresh: function (frm) {
		frm.set_query("payroll_cost_center", function () {
			return {
				filters: {
					company: frm.doc.company,
					is_group: 0,
				},
			};
		});

		// filter advance account based on salary currency
		if (frm.doc.salary_currency) {
			frm.set_query("employee_advance_account", function () {
				return {
					filters: {
						root_type: "Asset",
						is_group: 0,
						company: frm.doc.company,
						account_currency: frm.doc.salary_currency,
						account_type: "Receivable",
					},
				};
			});
		}
		frm.set_df_property("holiday_list", "hidden", 1);
		if (frm.fields_dict.create_user) {
			frm.set_df_property("create_user", "hidden", 1);
		}

		if (!frm.is_new() && !frm.doc.user_id) {
			frm.add_custom_button(__("Create User"), () => {
				const dialog = new frappe.ui.Dialog({
					title: __("Create User"),
					fields: [
						{
							fieldtype: "Data",
							fieldname: "email",
							label: __("Email"),
							reqd: 1,
							default:
								frm.doc.company_email || frm.doc.personal_email || frm.doc.user_id,
						},
						{
							fieldtype: "Check",
							fieldname: "create_user_permission",
							label: __("Create User Permission"),
							default: 0,
						},
					],
					primary_action_label: __("Create"),
					primary_action: (values) => {
						if (!values.email) {
							frappe.msgprint(__("Email is required to create a user."));
							return;
						}

						frappe
							.call({
								method: "hrms.overrides.employee_master.create_user_for_employee",
								args: {
									employee: frm.doc.name,
									email: values.email,
									create_user_permission: values.create_user_permission ? 1 : 0,
								},
								freeze: true,
								freeze_message: __("Creating User..."),
							})
							.then(() => {
								dialog.hide();
								frm.reload_doc();
							});
					},
				});

				dialog.show();
			});
		}
	},

	date_of_birth(frm) {
		frm.call({
			method: "hrms.overrides.employee_master.get_retirement_date",
			args: {
				date_of_birth: frm.doc.date_of_birth,
			},
		}).then((r) => {
			if (r && r.message) frm.set_value("date_of_retirement", r.message);
		});
	},
});
