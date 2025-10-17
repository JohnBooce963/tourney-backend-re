import { operator } from "@/model/operator";
import { Squad } from "@/model/squad";
import { neon } from "@neondatabase/serverless";

const sql = neon(`${process.env.DATABASE_URL}`)

export const dbService = new (class {
    // async test() {
    // const char_name_alt = 'Amiya'
    // const res = await sql`SELECT char_img FROM operator WHERE char_name_alt = ${char_name_alt}` ;

    // if (res.length === 0 || !res[0].char_img) {
    //     throw new Error("Image not found");
    // }

    // const buffer = res[0].char_img; // res is already an array of rows
    // return buffer;
    // }

    async getOperatorList(){
        const res = await sql`SELECT * FROM operator WHERE char_playable='1'`;

        const opList: operator[] = res.map(row => ({
            char_name: row.char_name,
            char_alt_name: row.char_name_alt,
            char_rarity: row.char_rarity,
            char_class: row.char_class,
            char_playable: row.char_playable,
            char_img: `data:image/png;base64,${row.char_img.toString("base64")}`,
        }));

        return opList
    }

    async getSpecificTheme(theme: number){
        const res = await sql`SELECT * FROM squad WHERE squad_theme = ${theme}`;

        const squad: Squad[] =  res.map(row => ({
            squad_id: row.squad_id,
            squad_name: row.squad_name,
            squad_theme: row.squad_theme,
            squad_img: `data:image/png;base64,${row.squad_img.toString("base64")}`,
        }))

        return squad
    }
})() 