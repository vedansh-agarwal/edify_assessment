// Use Online gdb compiler and change class name to Main for expected outputs 
/*
Input format:
6,What are your customer channels?,
a,B2B,1,
b,B2B & B2C,1,
c,B2C,1,
<Some random text for buffer>

Output format:
INSERT INTO questions (sectionName, questionDescription, choiceDetails, createdBy, updatedBy) VALUE ('Section 2 - Company Profile', '{"quesNo":"6", "quesDescription":"What are your customer channels?"}', '[{"key":"a", "value":"B2B", "rank":1}, {"key":"b", "value":"B2B & B2C", "rank":1}, {"key":"c", "value":"B2C", "rank":1}]', 'admin', 'admin');
*/

import java.util.Scanner;
public class questionToSQL
{
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		String output = "INSERT INTO questions (sectionName, questionDescription, choiceDetails, createdBy, updatedBy) VALUE ('Section 2 - Company Profile', ";
		boolean x = true;
		while(sc.hasNext()) {
		    String parts[] = sc.nextLine().split(",");
		    if(x) {
		        x = false;
		        output += "'{\"quesNo\":\""+parts[0]+"\", \"quesDescription\":\""+parts[1]+"\"}', '[";
		    } else {
		      output += "{\"key\":\""+parts[0]+"\", \"value\":\""+parts[1]+"\", \"rank\":"+parts[2]+"}, ";
		    }
		    System.out.println("\n\n\n");
		    System.out.println(output.substring(0, output.length()-2)+"]', 'admin', 'admin');");
		}
		sc.close();
	}
}