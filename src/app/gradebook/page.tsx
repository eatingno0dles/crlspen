'use client'

import React, { useState, useEffect } from "react";
import NavBar from "@/components/navBar";
import calculateGpa from "@/utils/getGpa";
import { Assignment, Class } from "@/types";
import getCredits from "@/utils/getCredits";
import LoadingScreen from "@/components/loadingScreen";

export default function Home() {
	const [classData, setClassData] = useState<Class[]>([]);
	const [assignmentData, setAssignmentData] = useState<Assignment[][]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setClassData(JSON.parse(
			decodeURIComponent(document.cookie.split(';').find(cookie => cookie.trim().startsWith("classDataQ3="))?.split('=')[1] || "[]")
		));

		setLoading(false);
	}, [setClassData]);

	const gpaInput = classData.map((data) => {
		return {
			grade: data.grade,
			credits: getCredits(data.name),
			ap: data.name.startsWith("AP"),
		};
	});

	const hUnweightedGpa = calculateGpa(gpaInput, "hUnweighted");
	const fUnweightedGpa = calculateGpa(gpaInput, "fUnweighted");
	const fWeightedGpa = calculateGpa(gpaInput, "fWeighted");

	useEffect(() => {
		async function backgroundScrape() {
			await fetch("/api/get_schedule_data", {
				method: "GET",
			});

			const assignmentDataQ3 = await fetch("/api/get_assignments_current", {
				method: "GET",
			}).then(res => res.json());

			setAssignmentData(assignmentDataQ3);
		}

		backgroundScrape();
	}, ["/api/get_schedule_data/", "/api/get_assignments_current/", setAssignmentData])

	function handleRowClick(index: number) {
		const element = document.getElementById(`a${index}`);
		const row = document.getElementById(`c${index}`);
		const arrow = row?.children[0];

		if (arrow) {
			if (arrow.textContent === "▶") {
				arrow.textContent = "▼";
			} else {
				arrow.textContent = "▶";
			}
		}

		if (element) {
			element.hidden = !element.hidden;
		}

		return;
	}

	return (
		loading ? <LoadingScreen loadText="Parsing Grades..." /> :
			<main>
				<NavBar />
				<div className="page-main">
					<div className="gpa-container">
						<div className="gpa-box hUnweightedGpa">
							<p>Q3 100 Scale: {hUnweightedGpa.toFixed(2)}</p>
						</div>
						<div className="gpa-box fWeightedGpa">
							<p>Q3 Weighted: {fWeightedGpa.toFixed(2)}</p>
						</div>
						<div className="gpa-box fUnweightedGpa">
							<p>Q3 Unweighted: {fUnweightedGpa.toFixed(2)}</p>
						</div>
					</div>
					<table className="grades-table">
						<tbody>
							<tr>
								<th></th>
								<th>TEACHERS</th>
								<th>CLASS</th>
								<th className="table-grade-header">GRADE</th>
								<th>RM.</th>
							</tr>
							{classData.map((data, index) => (
								<>
									<tr key={index} id={`c${index}`}>
										<td onClick={() => handleRowClick(index)} className="dropdown-icon">
											▶
										</td>
										<td className="teachers">{data.teacher}</td>
										<td className="class-name">{data.name}</td>
										<td className={`${data.grade !== null ? (data.grade >= 100 ? "hGrade" : "") : ""} grade`}>
											{data.grade !== null ? data.grade.toFixed(2) : "-"}
										</td>
										<td className="room-number">{data.room}</td>
									</tr>
									{assignmentData[index] && (
										<tr hidden={true} id={`a${index}`} key={index}>
											<td colSpan={5}>
												<table className="assignment-table">
													<tbody>
													{
														assignmentData[index].map((assignment, index) => (
															<tr key={index}>
																<td className="assignment-name">{assignment.name}</td>
																<td className="grade-category">{assignment.gradeCategory}</td>
																<td className="due-date">{assignment.dueDate}</td>
																<td className="assignment-grade-fraction">
																	{assignment.points !== null
																		? `${assignment.earned}/${assignment.points}`
																		: "-"}
																</td>
																<td className={`${assignment.earned !== null && assignment.points !== null ? ((assignment.earned / assignment.points * 100) >= 100 ? "hGrade" : "") : ""} assignment-grade-percent`}>
																	{
																		assignment.points && assignment.earned ?
																			(assignment.earned / assignment.points * 100).toFixed(2)
																			: "-"
																	}
																</td>
															</tr>
														))
													}
													</tbody>
												</table>
											</td>
										</tr>
									)}
								</>
							))}
						</tbody>
					</table>
				</div>
			</main>
	);
}
